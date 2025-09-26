// import type { NextRequest } from 'next/server'
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/expenses/[expenseId]'>) {
  try {
     const { expenseId } = await ctx.params

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handles PATCH requests to update an existing Expense by its ID.
 * Expects a JSON body with fields to update (e.g., description, amount).
 */
export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/expenses/[expenseId]'>) {
  try {
    const { expenseId } = await ctx.params
    const { description, amount, paidById, groupId, splitAmong } = await req.json();

    const updateData: any = {};
    if (description) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (paidById) updateData.paidById = paidById;
    if (groupId) updateData.groupId = groupId;

    // Begin a transaction to ensure all operations succeed or fail together
    const updatedExpense = await prisma.$transaction(async (prisma) => {
      // First, update the main expense record
      const expense = await prisma.expense.update({
        where: { id: expenseId },
        data: updateData,
      });

      // If splitAmong is provided, update the split details
      if (splitAmong && Array.isArray(splitAmong)) {
        // Delete all existing splits for this expense
        await prisma.splitUserGroup.deleteMany({
          where: { expenseId },
        });

        // Create the new SplitUserGroup records
        await prisma.splitUserGroup.createMany({
          data: splitAmong.map((split: { userId: string, amount: number }) => ({
            expenseId: expense.id,
            userId: split.userId,
            amount: split.amount,
          })),
        });
      }

      // Return the updated expense with its new split details
      const expenseWithSplits = await prisma.expense.findUnique({
        where: { id: expense.id },
        include: { splitAmong: true },
      });

      return expenseWithSplits;
    });

    return NextResponse.json(updatedExpense, { status: 200 });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to delete a single Expense by its ID.
 */
export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/expenses/[expenseId]'>) {
  try {
   const { expenseId } = await ctx.params

    // Begin a transaction to ensure both expense and its splits are deleted
    await prisma.$transaction(async (prisma) => {
      // Delete associated SplitUserGroup records first
      await prisma.splitUserGroup.deleteMany({
        where: { expenseId },
      });

      // Then delete the main Expense record
      await prisma.expense.delete({
        where: { id: expenseId },
      });
    });

    return NextResponse.json({ message: 'Expense and associated splits deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
