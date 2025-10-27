import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';

export async function GET(req: NextRequest, context: any) {
  const { groupId } = context.params;

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        expenses: {
          include: {
            paidBy: true,
            splitAmong: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    let totalExpense = 0;
    const balances: { [userId: string]: number } = {};
    const memberNames: { [userId: string]: string } = {};

    // Initialize balances and member names
    group.members.forEach(member => {
      balances[member.userId] = 0;
      memberNames[member.userId] = member.user.name;
    });

    // Calculate balances based on expenses
    group.expenses.forEach(expense => {
      totalExpense += expense.amount; // Accumulate total expense
      // Paid by
      balances[expense.paidById] += expense.amount;

      // Split among
      expense.splitAmong.forEach(split => {
        balances[split.userId] -= split.amount;
      });
    });

    // Separate debtors and creditors
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    for (const userId in balances) {
      const balance = balances[userId];
      if (balance < 0) {
        debtors.push({ userId, amount: Math.abs(balance) }); // Owe money
      } else if (balance > 0) {
        creditors.push({ userId, amount: balance }); // Owed money
      }
    }

    // Sort for optimal settlement (optional but good practice)
    debtors.sort((a, b) => b.amount - a.amount); // Highest debt first
    creditors.sort((a, b) => b.amount - a.amount); // Highest credit first

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

      if (debtor.amount === 0) {
        debtors.shift();
      }
      if (creditor.amount === 0) {
        creditors.shift();
      }
    }

    const formattedBalances = Object.keys(balances).map(userId => ({
      userId,
      userName: memberNames[userId],
      balance: balances[userId],
    }));

    const formattedSettlements = settlements.map(s => ({
      fromUser: memberNames[s.from],
      toUser: memberNames[s.to],
      amount: s.amount,
    }));

    return NextResponse.json({
      totalExpense: totalExpense,
      balances: formattedBalances,
      settlements: formattedSettlements,
    }, { status: 200 });

  } catch (error) {
    console.error('Error calculating settlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
