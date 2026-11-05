import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getGroupData } from '../../../action';
import { GroupMembersManager } from '@/components/GroupMembersManager';

export default async function GroupMembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const token = (await cookies()).get('token')?.value || '';

  try {
    const group = await getGroupData(groupId, token);
    return (
      <GroupMembersManager
        groupId={groupId}
        groupName={group.name}
        members={(group as any).members || []}
        token={token}
        canManage={group.currentUserRole === 'admin'}
      />
    );
  } catch {
    notFound();
  }
}
