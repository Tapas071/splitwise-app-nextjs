import { getGroupData } from '../../../action';
import { GroupSettingsForm } from '@/components/GroupSettingsForm';
import { cookies } from 'next/headers';

export default async function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const group = await getGroupData(groupId, cookieStore.get('token')?.value || '');

  return (
    <GroupSettingsForm
      groupId={groupId}
      initialName={group.name}
      initialCurrency={group.currency || 'INR'}
    />
  );
}
