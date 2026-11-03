import React from 'react';
import { getGroupData } from '../../action';
import { Button } from '@/components/ui/button';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { AddMemberModal } from '@/components/AddMemberModal';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';

// import { ThemeToggle } from '@/components/ThemeToggle';

const GroupPage = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value || "";
  
  const groupDataResponse = await getGroupData(groupId, token);
  const group: any = groupDataResponse;

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

  const formatAmount = (amount: number | undefined) => {
    if (typeof amount !== 'number' || Number.isNaN(amount)) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <>
      {/* <ThemeToggle /> */}
      <div className="container mx-auto p-6 bg-background text-foreground">
        <h1 className="text-4xl font-bold mb-8 text-center">{group.name}</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Members Section */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Members</h2>
             <AddMemberModal 
              groupId={groupId}
              token={token}
            />
            <ul className="space-y-3">
              {(group.members || []).map((member: any) => (
                <li 
                  key={member.id} 
                  className="flex justify-between items-center bg-muted p-3 rounded-md border border-border hover:bg-accent transition-colors"
                >
                  <span className="font-medium text-muted-foreground">
                    {member?.user?.name || member?.userId || 'Unknown member'}
                  </span>
                </li>
              ))}
            </ul>
           
          </div>

          {/* Expenses Section */}
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-card-foreground">Expenses</h2>
            <div className="m-y-5">
                <AddExpenseModal 
              members={group.members || []} 
              groupId={groupId}
              memberNames={memberNames}
              token={token}
            />
            </div>
           
            <ul className="space-y-4">
              {((group.expenses || []).slice().reverse()).map((expense: any) => (
                <li 
                  key={expense.id} 
                  className="bg-muted p-4 rounded-lg border border-border hover:border-ring transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg text-foreground">
                      {expense.description || 'Unnamed expense'}
                    </span>
                    <span className="text-xl font-bold text-chart-1">
                      {formatAmount(expense.amount)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Paid by <span className="font-medium text-foreground">{expense?.paidBy?.name || expense?.paidById || 'Unknown payer'}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Split Among:</h4>
                    <ul className="space-y-1 pl-2">
                      {(expense.splitAmong || []).map((split: any) => (
                        <li 
                          key={split.id || `${expense.id}-${split.userId}`} 
                          className="text-sm text-muted-foreground flex justify-between items-center py-1"
                        >
                          <span>{memberNames[split.userId] || split?.user?.name || `User ID: ${split.userId || 'unknown'}`}</span>
                          <span className="font-mono font-medium text-foreground">
                            {formatAmount(split.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
        
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <Button asChild>
            <Link href={`/groups/${groupId}/settlement`}>View Settlement</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default GroupPage;