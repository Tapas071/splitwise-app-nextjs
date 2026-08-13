import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../lib/mongodb';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/users/[userId]'>) {
  try {
    const { userId } = await ctx.params;
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: toObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    const memberships = await db.collection('userGroups').find({ userId }).toArray();
    return NextResponse.json({ ...serializeDoc(user), groups: memberships }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}