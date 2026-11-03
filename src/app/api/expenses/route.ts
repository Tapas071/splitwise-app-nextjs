import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../lib/mongodb';

// GET /api/expenses - Get all expenses
export async function GET() {
  try {
    const db = await getDb();
    const expenses = await db.collection('expenses').find({}).toArray();
    return NextResponse.json(expenses.map((expense) => serializeDoc(expense)));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { description, amount, paidById, groupId, splitAmong } = await req.json();

    if (!description || typeof amount !== 'number' || !paidById || !groupId || !Array.isArray(splitAmong)) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const db = await getDb();
    const groups = db.collection('groups');
    const users = db.collection('users');

    const group = await groups.findOne({ _id: toObjectId(groupId) });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const paidByUser = await users.findOne({ _id: toObjectId(paidById) });
    if (!paidByUser) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    const totalSplitAmount = splitAmong.reduce((sum: number, member: { amount: number }) => sum + Number(member.amount), 0);
    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      return NextResponse.json({ error: 'Split amounts do not add up to the total amount' }, { status: 400 });
    }

    const expenseDoc = {
      description,
      amount,
      paidById,
      groupId,
      splitAmong: splitAmong.map((member: { userId: string; amount: number }) => ({
        userId: member.userId,
        amount: Number(member.amount),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('expenses').insertOne(expenseDoc);
    return NextResponse.json(serializeDoc({ _id: result.insertedId, ...expenseDoc }), { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

