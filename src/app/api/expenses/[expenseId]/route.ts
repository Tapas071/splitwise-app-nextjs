// import type { NextRequest } from 'next/server'
import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../lib/mongodb';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/expenses/[expenseId]'>) {
  try {
    const { expenseId } = await ctx.params;
    const db = await getDb();
    const expense = await db.collection('expenses').findOne({ _id: toObjectId(expenseId) });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(serializeDoc(expense), { status: 200 });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/expenses/[expenseId]'>) {
  try {
    const { expenseId } = await ctx.params;
    const { description, amount, paidById, groupId, splitAmong } = await req.json();

    const db = await getDb();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (paidById !== undefined) updateData.paidById = paidById;
    if (groupId !== undefined) updateData.groupId = groupId;
    if (splitAmong !== undefined) {
      updateData.splitAmong = splitAmong.map((split: { userId: string; amount: number }) => ({
        userId: split.userId,
        amount: Number(split.amount),
      }));
    }

    const updatedExpense = await db.collection('expenses').findOneAndUpdate(
      { _id: toObjectId(expenseId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedExpense || !updatedExpense.value) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(serializeDoc(updatedExpense.value), { status: 200 });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/expenses/[expenseId]'>) {
  try {
    const { expenseId } = await ctx.params;
    const db = await getDb();
    await db.collection('expenses').deleteOne({ _id: toObjectId(expenseId) });

    return NextResponse.json({ message: 'Expense and associated splits deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
