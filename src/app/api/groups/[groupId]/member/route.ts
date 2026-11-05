import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../../lib/mongodb';
import { isGroupAdmin } from '../../../../../../lib/group-access';

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/member'>
) {
  try {
    const { groupId } = await ctx.params;
    const requesterId = req.headers.get('x-user-id');
    const { action = 'join', userId: targetUserId, message = '' } = await req.json();

    if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const groupObjectId = toObjectId(groupId);
    if (!groupObjectId) return NextResponse.json({ error: 'Invalid group' }, { status: 400 });

    if (action !== 'join' && action !== 'invite') {
      return NextResponse.json({ error: 'Action must be join or invite' }, { status: 400 });
    }

    const db = await getDb();
    const group = await db.collection('groups').findOne({ _id: groupObjectId });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isInvite = action === 'invite';
    const userId = isInvite ? targetUserId : requesterId;
    if (typeof userId !== 'string' || !userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    if (isInvite && !(await isGroupAdmin(db, groupId, requesterId))) {
      return NextResponse.json({ error: 'Only group admins can invite members.' }, { status: 403 });
    }
    if (!isInvite && group.visibility !== 'public') {
      return NextResponse.json({ error: 'This is a private group. Ask an admin for an invitation.' }, { status: 403 });
    }

    const user = await db.collection('users').findOne({ _id: toObjectId(userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const existingMember = await db.collection('userGroups').findOne({ userId, groupId });
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 409 });
    }

    const pendingRequest = await db.collection('groupRequests').findOne({
      groupId, userId, status: 'pending', type: isInvite ? 'invitation' : 'join_request',
    });
    if (pendingRequest) return NextResponse.json({ error: 'A request is already pending.' }, { status: 409 });

    const request = {
      userId,
      groupId,
      type: isInvite ? 'invitation' : 'join_request',
      status: 'pending',
      createdBy: requesterId,
      message: typeof message === 'string' ? message.trim().slice(0, 500) : '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('groupRequests').insertOne(request);

    return NextResponse.json({ request: serializeDoc({ _id: result.insertedId, ...request }) }, { status: 201 });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/member'>
) {
  const requesterId = req.headers.get('x-user-id');
  if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { groupId } = await ctx.params;
    const { userId, role } = await req.json();
    if (typeof userId !== 'string' || !userId || (role !== 'admin' && role !== 'member')) {
      return NextResponse.json({ error: 'A valid userId and role are required.' }, { status: 400 });
    }

    const db = await getDb();
    if (!(await isGroupAdmin(db, groupId, requesterId))) {
      return NextResponse.json({ error: 'Only group admins can manage member roles.' }, { status: 403 });
    }
    const membership = await db.collection('userGroups').findOne({ userId, groupId });
    if (!membership) return NextResponse.json({ error: 'Group member not found.' }, { status: 404 });

    if (role === 'member' && await isGroupAdmin(db, groupId, userId)) {
      const memberships = await db.collection('userGroups').find({ groupId }).toArray();
      const adminIds = await Promise.all(memberships.map(async (item) =>
        (await isGroupAdmin(db, groupId, String(item.userId))) ? String(item.userId) : null
      ));
      if (adminIds.filter(Boolean).length <= 1) {
        return NextResponse.json({ error: 'A group must have at least one admin.' }, { status: 409 });
      }
    }

    await db.collection('userGroups').updateOne({ userId, groupId }, { $set: { role, updatedAt: new Date() } });
    return NextResponse.json({ member: { userId, groupId, role } }, { status: 200 });
  } catch (error) {
    console.error('Update group member role error:', error);
    return NextResponse.json({ error: 'Unable to update member role.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<'/api/groups/[groupId]/member'>
) {
  try {
    const { groupId } = await ctx.params;
    const requesterId = req.headers.get('x-user-id');
    const { userId } = await req.json();

    if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDb();
    if (!(await isGroupAdmin(db, groupId, requesterId))) {
      return NextResponse.json({ error: 'Only group admins can remove members.' }, { status: 403 });
    }
    const targetMembership = await db.collection('userGroups').findOne({ userId, groupId });
    if (!targetMembership) return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    if (await isGroupAdmin(db, groupId, userId)) {
      const memberships = await db.collection('userGroups').find({ groupId }).toArray();
      const adminIds = await Promise.all(memberships.map(async (item) =>
        (await isGroupAdmin(db, groupId, String(item.userId))) ? String(item.userId) : null
      ));
      if (adminIds.filter(Boolean).length <= 1) {
        return NextResponse.json({ error: 'A group must have at least one admin.' }, { status: 409 });
      }
    }
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