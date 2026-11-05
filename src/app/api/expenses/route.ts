import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../lib/mongodb';

// GET /api/expenses - Get expenses visible to the authenticated user.
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const memberships = await db.collection('userGroups').find({ userId }).toArray();
    const groupIds = memberships.map((membership) => String(membership.groupId));
    const expenses = groupIds.length
      ? await db.collection('expenses').find({ groupId: { $in: groupIds } }).toArray()
      : [];
    return NextResponse.json(expenses.map((expense) => serializeDoc(expense)));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { description, amount, paidById, groupId, splitAmong } = await req.json();
    const requesterId = req.headers.get('x-user-id');

    if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const userGroups = db.collection('userGroups');
    const requesterMembership = await userGroups.findOne({ userId: requesterId, groupId });
    if (!requesterMembership) {
      return NextResponse.json({ error: 'Only group members can add expenses.' }, { status: 403 });
    }
    const participantIds = [...new Set([paidById, ...splitAmong.map((member: { userId: string }) => member.userId)])];
    const participantMemberships = await userGroups.find({ groupId, userId: { $in: participantIds } }).toArray();
    if (participantMemberships.length !== participantIds.length) {
      return NextResponse.json({ error: 'Payer and split participants must be group members.' }, { status: 400 });
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

