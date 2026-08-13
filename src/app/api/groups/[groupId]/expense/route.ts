import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../../lib/mongodb';

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/expense'>
) {
  try {
    const { groupId } = await ctx.params;
    const { description, amount, paidById, splitAmong } = await req.json();

    if (!description || !amount || !paidById || !splitAmong) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const group = await db.collection('groups').findOne({ _id: toObjectId(groupId) });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const paidByUser = await db.collection('users').findOne({ _id: toObjectId(paidById) });
    if (!paidByUser) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    const totalSplitAmount = splitAmong.reduce((sum: number, member: { amount: number }) => sum + Number(member.amount), 0);
    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      return NextResponse.json({ error: 'Split amounts do not add up to the total amount' }, { status: 400 });
    }

    const expenseDoc = {
      description,
      amount: Number(amount),
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
    return NextResponse.json({ expense: serializeDoc({ _id: result.insertedId, ...expenseDoc }) }, { status: 201 });
  } catch (error) {
    console.error('Add expense error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]/expense'>) {
  try {
    const { groupId } = await ctx.params;
    const db = await getDb();
    const expenses = await db.collection('expenses').find({ groupId }).toArray();
    return NextResponse.json(expenses.map((expense) => serializeDoc(expense)), { status: 200 });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]/expense'>) {
  try {
    const { groupId } = await ctx.params;
    const { expenseId } = await req.json();

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const expense = await db.collection('expenses').findOne({ _id: toObjectId(expenseId), groupId });
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await db.collection('expenses').deleteOne({ _id: toObjectId(expenseId) });
    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]/expense'>) {
  try {
    const { groupId } = await ctx.params;
    const { expenseId, description, amount, paidById, splitAmong } = await req.json();

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required for update' }, { status: 400 });
    }

    const db = await getDb();
    const existingExpense = await db.collection('expenses').findOne({ _id: toObjectId(expenseId), groupId });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const expenseUpdateData: Record<string, unknown> = { updatedAt: new Date() };
    if (description !== undefined) expenseUpdateData.description = description;
    if (paidById !== undefined) expenseUpdateData.paidById = paidById;
    if (amount !== undefined) expenseUpdateData.amount = Number(amount);
    if (splitAmong !== undefined) {
      expenseUpdateData.splitAmong = splitAmong.map((member: { userId: string; amount: number }) => ({
        userId: member.userId,
        amount: Number(member.amount),
      }));
    }

    const updatedExpense = await db.collection('expenses').findOneAndUpdate(
      { _id: toObjectId(expenseId) },
      { $set: expenseUpdateData },
      { returnDocument: 'after' }
    );

    if (!updatedExpense || !updatedExpense.value) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ expense: serializeDoc(updatedExpense.value) }, { status: 200 });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}