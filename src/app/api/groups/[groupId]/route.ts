// import type { NextRequest } from 'next/server'
import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../lib/mongodb';
import { isGroupAdmin } from '../../../../../lib/group-access';

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]'>) {
  const { groupId } = await ctx.params;
  try {
    const id = groupId;
    const { name } = await req.json();

    if (!id || typeof id !== 'string' || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "id" or "name" fields' }, { status: 400 });
    }

    const db = await getDb();
    const updatedGroup = await db.collection('groups').findOneAndUpdate(
      { _id: toObjectId(id) },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!updatedGroup || !updatedGroup.value) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(serializeDoc(updatedGroup.value), { status: 200 });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]'>) {
  const { groupId } = await ctx.params;
  try {
    const id = groupId;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "id" field' }, { status: 400 });
    }

    const db = await getDb();
    await db.collection('groups').deleteOne({ _id: toObjectId(id) });

    return NextResponse.json({ message: 'Group deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]'>) {
  try {
    const { groupId } = await ctx.params;
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();

    const group = await db.collection('groups').findOne({ _id: toObjectId(groupId) });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const members = await db.collection('userGroups').find({ groupId }).toArray();
    const membership = members.find((member) => String(member.userId) === userId);
    if (group.visibility !== 'public' && !membership) {
      return NextResponse.json({ error: 'This private group is available to members only.' }, { status: 403 });
    }
    const currentUserRole = membership
      ? ((await isGroupAdmin(db, groupId, userId)) ? 'admin' : 'member')
      : null;
    const expenses = await db.collection('expenses').find({ groupId }).toArray();

    const userIds = Array.from(
      new Set([
        ...members.map((member) => String(member.userId)),
        ...expenses
          .map((expense) => [
            String(expense.paidById),
            ...(Array.isArray(expense.splitAmong)
              ? expense.splitAmong.map((split) => String(split.userId))
              : []),
          ])
          .flat(),
      ])
    );

    const validUserObjectIds = userIds
      .map((id) => toObjectId(id))
      .filter((id): id is NonNullable<typeof id> => !!id);

    const users = validUserObjectIds.length
      ? await db.collection('users').find({ _id: { $in: validUserObjectIds } }, { projection: { name: 1, email: 1 } }).toArray()
      : [];

    const userMap = new Map(users.map((user) => [String(user._id), serializeDoc(user)]));

    const hydratedMembers = await Promise.all(members.map(async (member) => ({
      ...serializeDoc(member),
      role: (await isGroupAdmin(db, groupId, String(member.userId))) ? 'admin' : 'member',
      user: userMap.get(String(member.userId)) ?? null,
    })));

    const hydratedExpenses = expenses.map((expense) => ({
      ...serializeDoc(expense),
      paidBy: userMap.get(String(expense.paidById)) ?? null,
      splitAmong: Array.isArray(expense.splitAmong)
        ? expense.splitAmong.map((split) => ({
            ...split,
            user: userMap.get(String(split.userId)) ?? null,
          }))
        : [],
    }));

      if (!membership) {
        return NextResponse.json({
          ...serializeDoc(group),
          visibility: group.visibility || 'private',
          currentUserRole: null,
          members: [],
          expenses: [],
        }, { status: 200 });
      }

    return NextResponse.json({
      ...serializeDoc(group),
      visibility: group.visibility || 'private',
      currentUserRole,
      members: hydratedMembers,
      expenses: hydratedExpenses,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}