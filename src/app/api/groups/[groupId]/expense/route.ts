import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/expense'>
) {
  try {
     const { groupId } = await ctx.params
    // const { groupId } = params;
    const { description, amount, paidById, splitAmong } = await req.json();

    if (!description || !amount || !paidById || !splitAmong) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const paidByUser = await prisma.user.findUnique({ where: { id: paidById } });
    if (!paidByUser) {
      return NextResponse.json({ error: 'Payer not found' }, { status: 404 });
    }

    const totalSplitAmount = splitAmong.reduce(
      (sum: number, member: { amount: number }) => sum + member.amount,
      0
    );
    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      return NextResponse.json(
        { error: 'Split amounts do not add up to the total amount' },
        { status: 400 }
      );
    }

    const newExpense = await prisma.$transaction(async (prisma) => {
      const expense = await prisma.expense.create({
        data: {
          description,
          amount,
          paidById,
          groupId,
        },
      });

      const splitData = splitAmong.map((member: { userId: string; amount: number }) => ({
        expenseId: expense.id,
        userId: member.userId,
        amount: member.amount,
      }));

      await prisma.splitUserGroup.createMany({
        data: splitData,
      });

      return expense;
    });

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error) {
    console.error('Add expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/expense'> 
) {
  try {
    const { groupId } = await ctx.params

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        paidBy: true,
        splitAmong: true,
      },
    });

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/expense'> 
) {
  try {
    const { groupId } = await ctx.params
    const { expenseId } = await req.json();

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, groupId },
    });
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.splitUserGroup.deleteMany({
        where: { expenseId },
      });
      await prisma.expense.delete({
        where: { id: expenseId },
      });
    });

    return NextResponse.json(
      { message: 'Expense deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/expense'> 
) {
  try {
    const { groupId } = await ctx.params
    const { expenseId, description, amount, paidById, splitAmong } =
      await req.json();

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required for update' },
        { status: 400 }
      );
    }

    // 1. Fetch the existing expense to check ownership and get current values
    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId, groupId },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Prepare update data for the Expense model
    const expenseUpdateData: {
      description?: string;
      amount?: number;
      paidById?: string;
    } = {};

    // Use nullish coalescing to determine the final amount for validation
    let finalAmount = existingExpense.amount;

    if (description !== undefined) {
      expenseUpdateData.description = description;
    }
    if (paidById !== undefined) {
      expenseUpdateData.paidById = paidById;
    }
    if (amount !== undefined) {
      expenseUpdateData.amount = amount;
      finalAmount = amount; // Update the final amount for split validation
    }

    // 2. Handle Split Update Logic
    if (splitAmong !== undefined) {
      if (!Array.isArray(splitAmong) || splitAmong.length === 0) {
        return NextResponse.json(
          { error: 'splitAmong must be a non-empty array' },
          { status: 400 }
        );
      }
      
      // Validation: Check if the new splits sum up to the determined final amount
      // if (!validateSplit(finalAmount, splitAmong)) {
      //   return NextResponse.json(
      //     { error: 'New split amounts do not add up to the total amount' },
      //     { status: 400 }
      //   );
      // }
      
      // If splits are valid, we perform the update in a transaction
      const updatedExpense = await prisma.$transaction(async (prisma) => {
        // A. Delete existing splits for this expense
        await prisma.splitUserGroup.deleteMany({
          where: { expenseId },
        });

        // B. Create the new split records
        const newSplitData = splitAmong.map(
          (member: { userId: string; amount: number }) => ({
            expenseId,
            userId: member.userId,
            amount: member.amount,
          })
        );
        await prisma.splitUserGroup.createMany({
          data: newSplitData,
        });

        // C. Update the main expense record
        return prisma.expense.update({
          where: { id: expenseId },
          data: expenseUpdateData,
          include: { splitAmong: true },
        });
      });

      return NextResponse.json({ expense: updatedExpense }, { status: 200 });

    } else {
      // 3. Handle Simple Expense Update (no split changes)
      if (Object.keys(expenseUpdateData).length === 0) {
         return NextResponse.json(
          { error: 'No valid fields provided for update' },
          { status: 400 }
        );
      }
      
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: expenseUpdateData,
        include: { splitAmong: true },
      });

      return NextResponse.json({ expense: updatedExpense }, { status: 200 });
    }
    
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}