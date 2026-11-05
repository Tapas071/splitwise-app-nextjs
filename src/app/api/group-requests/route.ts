import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../lib/mongodb';
import { isGroupAdmin } from '../../../../lib/group-access';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getDb();
    const memberships = await db.collection('userGroups').find({ userId }).toArray();
    const adminGroupIds: string[] = [];
    for (const membership of memberships) {
      const groupId = String(membership.groupId);
      if (await isGroupAdmin(db, groupId, userId)) adminGroupIds.push(groupId);
    }

    const pending = await db.collection('groupRequests').find({
      status: 'pending',
      $or: [
        { userId, type: 'invitation' },
        { groupId: { $in: adminGroupIds }, type: 'join_request' },
      ],
    }).sort({ createdAt: -1 }).toArray();

    const groupIds = [...new Set(pending.map((item) => toObjectId(String(item.groupId))).filter((id): id is NonNullable<typeof id> => Boolean(id)))];
    const userIds = [...new Set(pending.map((item) => toObjectId(String(item.type === 'invitation' ? item.createdBy : item.userId))).filter((id): id is NonNullable<typeof id> => Boolean(id)))];
    const groups = groupIds.length ? await db.collection('groups').find({ _id: { $in: groupIds } }).toArray() : [];
    const users = userIds.length ? await db.collection('users').find({ _id: { $in: userIds } }).toArray() : [];
    const groupMap = new Map(groups.map((group) => [String(group._id), serializeDoc(group)]));
    const userMap = new Map(users.map((user) => [String(user._id), String(user.name || '')]));
    const hydrated = pending.map((item) => ({
      ...serializeDoc(item),
      group: groupMap.get(String(item.groupId)) || null,
      requesterName: userMap.get(String(item.type === 'invitation' ? item.createdBy : item.userId)) || '',
    }));

    return NextResponse.json({ requests: hydrated }, { status: 200 });
  } catch (error) {
    console.error('Get group requests error:', error);
    return NextResponse.json({ error: 'Unable to load group requests.' }, { status: 500 });
  }
}
