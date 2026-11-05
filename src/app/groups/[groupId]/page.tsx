import { getGroupData } from '../../action';
import { GroupActivityView } from '@/components/GroupActivityView';
import { cookies } from 'next/headers';

const GroupPage = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value || "";
  
  const groupDataResponse = await getGroupData(groupId, token);
  const group: any = groupDataResponse;
  const isAdmin = group.currentUserRole === 'admin';

  const memberNames = (group.expenses || []).reduce((acc: any, expense: any) => {
    const paidByName = expense?.paidBy?.name || expense?.paidById;
    if (paidByName && expense?.paidBy?.id) {
      acc[expense.paidBy.id] = expense.paidBy.name;
    }
    return acc;
  }, {});

  (group.members || []).forEach((member: any) => {
    if (member?.user?.name) {
      memberNames[member.userId] = member.user.name;
    }
  });

  return <GroupActivityView groupId={groupId} group={group} token={token} isAdmin={isAdmin} memberNames={memberNames} />;
};

export default GroupPage;