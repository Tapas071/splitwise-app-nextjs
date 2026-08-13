import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../../lib/mongodb';

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/member'>
) {
  try {
    const { groupId } = await ctx.params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: toObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const group = await db.collection('groups').findOne({ _id: toObjectId(groupId) });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const existingMember = await db.collection('userGroups').findOne({ userId, groupId });
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 409 });
    }

    const result = await db.collection('userGroups').insertOne({
      userId,
      groupId,
      createdAt: new Date(),
    });

    return NextResponse.json({ member: serializeDoc({ _id: result.insertedId, userId, groupId }) }, { status: 201 });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/member'>
) {
  try {
    const { groupId } = await ctx.params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const deletion = await db.collection('userGroups').deleteMany({ userId, groupId });

    if (deletion.deletedCount === 0) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User removed from group successfully' }, { status: 200 });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}