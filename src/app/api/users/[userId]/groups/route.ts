import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../../lib/mongodb';

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/users/[userId]/groups'>
) {
  try {
    const { userId } = await ctx.params;
    const db = await getDb();

    const user = await db.collection('users').findOne({ _id: toObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const memberships = await db.collection('userGroups').find({ userId }).toArray();
    const groupIds = memberships
      .map((membership) => toObjectId(membership.groupId))
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

    const groups = await db.collection('groups').find({ _id: { $in: groupIds } }).toArray();

    return NextResponse.json({ groups: groups.map((group) => serializeDoc(group)) });
  } catch (error) {
    console.error('Get user groups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
