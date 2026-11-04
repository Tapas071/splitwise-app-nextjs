import React from 'react';
import { getGroupData } from '../../action';
import { Button } from '@/components/ui/button';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { AddMemberModal } from '@/components/AddMemberModal';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ReceiptText, Settings2, UsersRound, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/currencies';

// import { ThemeToggle } from '@/components/ThemeToggle';

const GroupPage = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value || "";
  
  const groupDataResponse = await getGroupData(groupId, token);
  const group: any = groupDataResponse;
  const currency = group.currency || 'INR';

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
    if (typeof amount !== 'number' || Number.isNaN(amount)) return formatCurrency(0, currency);
    return formatCurrency(amount, currency);
  };

  return (
    <div className="page-container py-9 sm:py-12">
      <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" /> All groups</Link>
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-primary p-7 text-primary-foreground shadow-lg shadow-primary/10 sm:p-9">
        <div className="absolute -right-14 -top-32 -z-10 size-80 rounded-full border border-white/15" />
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/85"><UsersRound className="size-3.5" /> GROUP SPACE</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{group.name}</h1>
            <p className="mt-3 text-white/75">A shared space for expenses and keeping everyone in sync.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href={`/groups/${groupId}/settings`} aria-label="Group settings"><Settings2 className="size-4" /><span className="sm:hidden">Settings</span><span className="hidden sm:inline">Group settings</span></Link></Button>
            <Button asChild variant="secondary" className="rounded-xl"><Link href={`/groups/${groupId}/settlement`}>View settlement <ArrowRight className="size-4" /></Link></Button>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/15 px-3 py-1.5">{(group.members || []).length} {(group.members || []).length === 1 ? 'member' : 'members'}</span>
          <span className="rounded-full bg-white/15 px-3 py-1.5">{(group.expenses || []).length} {(group.expenses || []).length === 1 ? 'expense' : 'expenses'}</span>
          <span className="rounded-full bg-white/15 px-3 py-1.5">Currency · {currency}</span>
        </div>
      </section>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">The people</p>
              <h2 className="mt-1 text-xl font-semibold">Members</h2>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><UsersRound className="size-5" /></span>
          </div>
          <ul className="mt-5 space-y-2">
            {(group.members || []).map((member: any) => {
              const name = member?.user?.name || member?.userId || 'Unknown member';
              return (
                <li key={member.id} className="flex items-center gap-3 rounded-xl bg-muted/70 p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{String(name).slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 truncate font-medium">{name}</span>
                </li>
              );
            })}
          </ul>
          {(group.members || []).length === 0 && <p className="mt-5 rounded-xl bg-muted/70 p-4 text-sm text-muted-foreground">No members have joined yet.</p>}
          <div className="mt-5"><AddMemberModal groupId={groupId} token={token} /></div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><ReceiptText className="size-5" /></span>
              <div><p className="eyebrow">Money in motion</p><h2 className="mt-1 text-xl font-semibold">Expenses</h2></div>
            </div>
            <div className="sm:w-44"><AddExpenseModal members={group.members || []} groupId={groupId} memberNames={memberNames} token={token} currency={currency} /></div>
          </div>
          {(group.expenses || []).length > 0 ? (
            <ul className="mt-5 space-y-3">
              {((group.expenses || []).slice().reverse()).map((expense: any) => (
                <li key={expense.id} className="rounded-2xl border border-border/80 bg-background/70 p-4 transition-colors hover:border-primary/30 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{expense.description || 'Unnamed expense'}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Paid by <span className="font-medium text-foreground">{expense?.paidBy?.name || expense?.paidById || 'Unknown payer'}</span></p>
                    </div>
                    <span className="shrink-0 text-lg font-bold tracking-tight text-primary">{formatAmount(expense.amount)}</span>
                  </div>
                  <div className="mt-4 border-t border-border/70 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Split details</p>
                    <ul className="space-y-2">
                      {(expense.splitAmong || []).map((split: any) => (
                        <li key={split.id || `${expense.id}-${split.userId}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate text-muted-foreground">{memberNames[split.userId] || split?.user?.name || `User ID: ${split.userId || 'unknown'}`}</span>
                          <span className="font-medium tabular-nums">{formatAmount(split.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl bg-muted/60 px-5 py-10 text-center">
              <Wallet className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-3 font-medium">No expenses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add the first one to get your group started.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GroupPage;