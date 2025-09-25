import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';


// GET /api/expenses - Get all expenses
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany();
    return NextResponse.json(expenses);
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

    // Begin a transaction to ensure all operations succeed or fail together
    const newExpense = await prisma.$transaction(async (prisma) => {
      // Create the main expense record
      const expense = await prisma.expense.create({
        data: {
          description,
          amount,
          paidById,
          groupId,
          // splitAmong will be connected below
        },
      });

      // Create the SplitUserGroup records for each split
      await prisma.splitUserGroup.createMany({
        data: splitAmong.map((split: { userId: string, amount: number }) => ({
          expenseId: expense.id,
          userId: split.userId,
          amount: split.amount,
        })),
      });

      // Return the newly created expense with its split details
      const expenseWithSplits = await prisma.expense.findUnique({
        where: { id: expense.id },
        include: { splitAmong: true },
      });

      return expenseWithSplits;
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handles GET requests to fetch all Expenses.
 */
// export async function GET() {
//   try {
//     const allExpenses = await prisma.expense.findMany({
//       include: {
//         paidBy: true,
//         group: true,
//         splitAmong: true,
//       },
//     });

//     return NextResponse.json(allExpenses, { status: 200 });
//   } catch (error) {
//     console.error('Error fetching expenses:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }
