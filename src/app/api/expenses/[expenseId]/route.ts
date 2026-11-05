// import type { NextRequest } from 'next/server'
import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../lib/mongodb';
import { isGroupAdmin } from '../../../../../lib/group-access';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/expenses/[expenseId]'>) {
  try {
    const { expenseId } = await ctx.params;
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const expense = await db.collection('expenses').findOne({ _id: toObjectId(expenseId) });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    if (!(await db.collection('userGroups').findOne({ userId, groupId: String(expense.groupId) }))) {
      return NextResponse.json({ error: 'Only group members can view this expense.' }, { status: 403 });
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
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { description, amount, paidById, groupId, splitAmong } = await req.json();

    const db = await getDb();
    const existing = await db.collection('expenses').findOne({ _id: toObjectId(expenseId) });
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    if (!(await isGroupAdmin(db, String(existing.groupId), userId))) {
      return NextResponse.json({ error: 'Only group admins can edit expenses.' }, { status: 403 });
    }
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
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const expense = await db.collection('expenses').findOne({ _id: toObjectId(expenseId) });
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    if (!(await isGroupAdmin(db, String(expense.groupId), userId))) {
      return NextResponse.json({ error: 'Only group admins can remove expenses.' }, { status: 403 });
    }
    await db.collection('expenses').deleteOne({ _id: toObjectId(expenseId) });

    return NextResponse.json({ message: 'Expense and associated splits deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
