import Link from 'next/link';
import { ArrowLeft, ArrowRight, LockKeyhole, Settings2, UsersRound, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { AddMemberModal } from '@/components/AddMemberModal';
import { GroupRequestsPanel } from '@/components/GroupRequestsPanel';
import { formatCurrency } from '@/lib/currencies';

interface GroupActivityViewProps {
  groupId: string;
  group: any;
  token: string;
  isAdmin: boolean;
  memberNames: Record<string, string>;
}

function formatTime(value: unknown) {
  const date = value ? new Date(value as string) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function GroupActivityView({ groupId, group, token, isAdmin, memberNames }: GroupActivityViewProps) {
  const members = group.members || [];
  const expenses = group.expenses || [];
  const currency = group.currency || 'INR';
  const events = [
    ...members.map((member: any) => ({
      id: `member-${member.id}`,
      type: 'member' as const,
      date: member.createdAt,
      name: member?.user?.name || 'A member',
    })),
    ...expenses.map((expense: any) => ({
      id: `expense-${expense.id}`,
      type: 'expense' as const,
      date: expense.createdAt,
      expense,
    })),
  ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

  const memberAvatars = members.slice(0, 6);

  return (
    <div className="h-[calc(100dvh-4.5rem)] overflow-hidden">
      <div className="page-container flex h-full flex-col py-3 sm:py-4">
        <Link href="/" className="mb-2 inline-flex shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" /> All groups</Link>

        <header className="relative shrink-0 overflow-hidden rounded-[1.5rem] bg-primary px-5 py-4 text-primary-foreground shadow-lg shadow-primary/10 sm:px-7 sm:py-5">
          <div className="pointer-events-none absolute -right-10 -top-20 size-48 rounded-full border border-white/15" />
          <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-white/75">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1"><UsersRound className="size-3.5" /> GROUP CHAT</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><LockKeyhole className="size-3" /> {group.visibility === 'public' ? 'Public' : 'Private'}</span>
              </div>
              <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{group.name}</h1>
              <p className="mt-1 text-sm text-white/75">{members.length} {members.length === 1 ? 'member' : 'members'} · {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} · {currency}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {isAdmin && <Button asChild size="sm" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href={`/groups/${groupId}/settings`} aria-label="Group settings"><Settings2 className="size-4" /><span className="hidden sm:inline">Settings</span></Link></Button>}
              <Button asChild size="sm" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href={`/groups/${groupId}/members`} aria-label="Members and permissions"><UsersRound className="size-4" /><span className="hidden sm:inline">Members</span></Link></Button>
              <Button asChild size="sm" variant="secondary" className="rounded-xl"><Link href={`/groups/${groupId}/settlement`}><span className="sm:hidden">Settle</span><span className="hidden sm:inline">Settle up</span><ArrowRight className="size-4" /></Link></Button>
            </div>
          </div>
        </header>

        <div className="mt-2 flex shrink-0 items-center gap-2 lg:hidden">
          <div className="group-activity-scroll flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {members.map((member: any) => {
              const name = member?.user?.name || 'Member';
              return <span key={member.id} className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">{name}</span>;
            })}
            {members.length === 0 && <span className="text-xs text-muted-foreground">No members yet</span>}
          </div>
          {isAdmin && <div className="w-32 shrink-0"><AddMemberModal groupId={groupId} token={token} /></div>}
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch lg:gap-5">
          <section aria-label="Group expense activity" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-secondary text-secondary-foreground"><WalletCards className="size-4" /></span>
                <div><h2 className="font-semibold">Activity</h2><p className="text-xs text-muted-foreground">Expenses and member updates</p></div>
              </div>
              <div className="flex items-center -space-x-2" aria-label={`${members.length} group members`}>
                {memberAvatars.map((member: any) => {
                  const name = member?.user?.name || 'Member';
                  return <span key={member.id} title={name} className="grid size-8 place-items-center rounded-full border-2 border-card bg-primary/10 text-xs font-bold text-primary">{String(name).slice(0, 1).toUpperCase()}</span>;
                })}
                {members.length > memberAvatars.length && <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold">+{members.length - memberAvatars.length}</span>}
              </div>
            </div>

            <div aria-label="Scrollable group activity" className="group-activity-scroll flex min-h-0 flex-1 flex-col-reverse gap-4 overflow-y-auto overscroll-contain bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.04] via-background to-secondary/20 px-3 py-5 pb-24 sm:px-6">
              {events.length ? events.slice().reverse().map((event) => (
                <div key={event.id}>
                  {event.type === 'member' ? (
                    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                      <UsersRound className="size-3.5 text-primary" /><span><strong className="font-semibold text-foreground">{event.name}</strong> joined the group</span><time>{formatTime(event.date)}</time>
                    </div>
                  ) : (
                    <article className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm border border-primary/15 bg-primary/[0.07] p-4 shadow-sm sm:max-w-[82%] sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{event.expense.description || 'Expense'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{event.expense?.paidBy?.name || memberNames[event.expense?.paidById] || 'A member'} paid</p>
                        </div>
                        <span className="shrink-0 text-lg font-bold tabular-nums text-primary">{formatCurrency(Number(event.expense.amount) || 0, currency)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-primary/10 pt-2 text-xs text-muted-foreground">
                        <span>Split with {(event.expense.splitAmong || []).length} {(event.expense.splitAmong || []).length === 1 ? 'person' : 'people'}</span>
                        <time>{formatTime(event.date)}</time>
                      </div>
                      {!!event.expense.splitAmong?.length && (
                        <details className="group mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-primary marker:content-none">View split details</summary>
                          <ul className="mt-2 space-y-1.5 rounded-xl bg-background/70 p-3">
                            {event.expense.splitAmong.map((split: any) => (
                              <li key={split.id || `${event.id}-${split.userId}`} className="flex justify-between gap-3 text-xs">
                                <span className="truncate text-muted-foreground">{memberNames[split.userId] || split?.user?.name || 'Member'}</span>
                                <span className="font-medium tabular-nums">{formatCurrency(Number(split.amount) || 0, currency)}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </article>
                  )}
                </div>
              )) : (
                <div className="grid min-h-[19rem] place-items-center text-center">
                  <div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><WalletCards className="size-6" /></span><p className="mt-3 font-semibold">The chat is ready</p><p className="mt-1 text-sm text-muted-foreground">Add an expense below to start the group activity.</p></div>
                </div>
              )}
            </div>
          </section>

          <aside className="group-activity-scroll hidden min-h-0 overflow-y-auto surface-card p-4 sm:p-5 lg:block">
            <div className="flex items-center justify-between gap-3">
              <div><p className="eyebrow">Your circle</p><h2 className="mt-1 text-lg font-semibold">Members <span className="text-sm font-normal text-muted-foreground">({members.length})</span></h2></div>
              <UsersRound className="size-5 text-primary" />
            </div>
            {isAdmin && <div className="mt-4"><AddMemberModal groupId={groupId} token={token} /></div>}
            <ul className="mt-4 space-y-2">
              {members.map((member: any) => {
                const name = member?.user?.name || 'Unknown member';
                return (
                  <li key={member.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{String(name).slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    {member.role === 'admin' && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Admin</span>}
                  </li>
                );
              })}
            </ul>
            {members.length === 0 && <p className="mt-4 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">No members yet.</p>}
            {isAdmin && <div className="mt-5"><GroupRequestsPanel groupId={groupId} /></div>}
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/90 px-3 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
        <div className="page-container flex items-center gap-3">
          <div className="hidden text-xs text-muted-foreground sm:block"><span className="block font-semibold text-foreground">Group chat</span><span>Share an expense</span></div>
          <div className="flex-1"><AddExpenseModal members={members} groupId={groupId} memberNames={memberNames} token={token} currency={currency} composer /></div>
        </div>
      </div>
    </div>
  );
}
