import { getDb, toObjectId } from './mongodb';

export async function isGroupAdmin(db: Awaited<ReturnType<typeof getDb>>, groupId: string, userId: string) {
  const membership = await db.collection('userGroups').findOne({ groupId, userId });
  if (!membership) return false;
  if (typeof membership.role === 'string') return membership.role === 'admin';

  const group = await db.collection('groups').findOne({ _id: toObjectId(groupId) });
  if (group?.createdBy === userId) return true;

  // For groups created before roles existed, preserve a clear owner: the earliest member.
  const earliestMembership = await db.collection('userGroups')
    .find({ groupId })
    .sort({ createdAt: 1, _id: 1 })
    .limit(1)
    .toArray();
  return String(earliestMembership[0]?.userId || '') === userId;
}
