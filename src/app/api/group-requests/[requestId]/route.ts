import { NextRequest, NextResponse } from 'next/server';
import { getDb, toObjectId } from '../../../../../lib/mongodb';
import { isGroupAdmin } from '../../../../../lib/group-access';

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/group-requests/[requestId]'>) {
  const actorId = req.headers.get('x-user-id');
  if (!actorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { requestId } = await ctx.params;
    const requestObjectId = toObjectId(requestId);
    if (!requestObjectId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const { action } = await req.json();
    const decisions: Record<string, { type: string; status: string }> = {
      accept: { type: 'invitation', status: 'accepted' },
      decline: { type: 'invitation', status: 'declined' },
      approve: { type: 'join_request', status: 'accepted' },
      reject: { type: 'join_request', status: 'declined' },
    };
    const decision = decisions[action];
    if (!decision) return NextResponse.json({ error: 'Unsupported request action.' }, { status: 400 });

    const db = await getDb();
    const groupRequest = await db.collection('groupRequests').findOne({ _id: requestObjectId, status: 'pending' });
    if (!groupRequest || groupRequest.type !== decision.type) {
      return NextResponse.json({ error: 'Pending request not found.' }, { status: 404 });
    }

    if (groupRequest.type === 'invitation') {
      if (String(groupRequest.userId) !== actorId) {
        return NextResponse.json({ error: 'Only the invited user can respond.' }, { status: 403 });
      }
    } else if (!(await isGroupAdmin(db, String(groupRequest.groupId), actorId))) {
      return NextResponse.json({ error: 'Only group admins can review join requests.' }, { status: 403 });
    }

    if (decision.status === 'accepted') {
      const existing = await db.collection('userGroups').findOne({
        userId: String(groupRequest.userId),
        groupId: String(groupRequest.groupId),
      });
      if (!existing) {
        await db.collection('userGroups').insertOne({
          userId: String(groupRequest.userId),
          groupId: String(groupRequest.groupId),
          role: 'member',
          createdAt: new Date(),
        });
      }
    }

    await db.collection('groupRequests').updateOne(
      { _id: requestObjectId, status: 'pending' },
      { $set: { status: decision.status, reviewedBy: actorId, updatedAt: new Date() } },
    );
    return NextResponse.json({ message: decision.status === 'accepted' ? 'Request accepted.' : 'Request declined.' });
  } catch (error) {
    console.error('Resolve group request error:', error);
    return NextResponse.json({ error: 'Unable to update this request.' }, { status: 500 });
  }
}
