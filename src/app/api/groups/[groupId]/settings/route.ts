import { NextRequest, NextResponse } from 'next/server';
import { getDb, serializeDoc, toObjectId } from '../../../../../../lib/mongodb';
import { CURRENCIES } from '@/lib/currencies';
import { isGroupAdmin } from '../../../../../../lib/group-access';

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/groups/[groupId]/settings'>) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { groupId } = await ctx.params;
    const { name, currency, visibility } = await req.json();
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || normalizedName.length > 80) {
      return NextResponse.json({ error: 'Group name must be between 1 and 80 characters.' }, { status: 400 });
    }
    if (!CURRENCIES.some((option) => option.code === currency)) {
      return NextResponse.json({ error: 'Choose a supported currency.' }, { status: 400 });
    }
    if (visibility !== undefined && visibility !== 'public' && visibility !== 'private') {
      return NextResponse.json({ error: 'Visibility must be public or private.' }, { status: 400 });
    }

    const db = await getDb();
    const groupObjectId = toObjectId(groupId);
    if (!groupObjectId) return NextResponse.json({ error: 'Invalid group' }, { status: 400 });

    if (!(await isGroupAdmin(db, groupId, userId))) {
      return NextResponse.json({ error: 'Only group admins can change group settings.' }, { status: 403 });
    }

    const updates = { name: normalizedName, currency, ...(visibility ? { visibility } : {}), updatedAt: new Date() };
    const result = await db.collection('groups').updateOne(
      { _id: groupObjectId },
      { $set: updates }
    );
    if (!result.matchedCount) return NextResponse.json({ error: 'Group not found.' }, { status: 404 });

    const updatedGroup = await db.collection('groups').findOne({ _id: groupObjectId });
    return NextResponse.json({ group: serializeDoc(updatedGroup) });
  } catch (error) {
    console.error('Update group settings error:', error);
    return NextResponse.json({ error: 'Unable to save group settings.' }, { status: 500 });
  }
}
