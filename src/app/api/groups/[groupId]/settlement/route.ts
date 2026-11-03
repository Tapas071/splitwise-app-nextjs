import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../../lib/mongodb';

export async function GET(req: NextRequest, context: any) {
  const { groupId } = context.params;

  try {
    const db = await getDb();
    const group = await db.collection('groups').findOne({ _id: toObjectId(groupId) });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const members = await db.collection('userGroups').find({ groupId }).toArray();
    const expenses = await db.collection('expenses').find({ groupId }).toArray();
    const userIds = members.map((member) => member.userId);
    const objectIds = userIds
      .map((id) => toObjectId(id))
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

    const users = await db.collection('users').find({ _id: { $in: objectIds } }).toArray();

    const memberNames: Record<string, string> = {};
    users.forEach((user) => {
      memberNames[user._id.toString()] = user.name;
    });

    let totalExpense = 0;
    const balances: Record<string, number> = {};

    members.forEach((member) => {
      balances[member.userId] = 0;
      memberNames[member.userId] = memberNames[member.userId] || 'Unknown User';
    });

    expenses.forEach((expense) => {
      totalExpense += expense.amount;
      balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount;

      (expense.splitAmong || []).forEach((split: { userId: string; amount: number }) => {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
      });
    });

    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance < 0) debtors.push({ userId, amount: Math.abs(balance) });
      else if (balance > 0) creditors.push({ userId, amount: balance });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: { from: string; to: string; amount: number }[] = [];
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];
      const settlementAmount = Math.min(debtor.amount, creditor.amount);

      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: settlementAmount,
      });

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount === 0) debtors.shift();
      if (creditor.amount === 0) creditors.shift();
    }

    const formattedBalances = Object.keys(balances).map((userId) => ({
      userId,
      userName: memberNames[userId] || userId,
      balance: balances[userId],
    }));

    const formattedSettlements = settlements.map((s) => ({
      fromUser: memberNames[s.from] || s.from,
      toUser: memberNames[s.to] || s.to,
      amount: s.amount,
    }));

    return NextResponse.json({
      totalExpense,
      balances: formattedBalances,
      settlements: formattedSettlements,
    }, { status: 200 });
  } catch (error) {
    console.error('Error calculating settlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

