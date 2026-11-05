'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Crown, ShieldCheck, UserRound, UserRoundCog, UserRoundX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddMemberModal } from '@/components/AddMemberModal';

interface Member {
  id: string;
  userId: string;
  role: 'admin' | 'member';
  user?: { name?: string; email?: string } | null;
}

interface GroupMembersManagerProps {
  groupId: string;
  groupName: string;
  members: Member[];
  token: string;
  canManage: boolean;
}

export function GroupMembersManager({ groupId, groupName, members, token, canManage }: GroupMembersManagerProps) {
  const router = useRouter();
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const adminsCount = members.filter((member) => member.role === 'admin').length;

  const updateRole = async (member: Member) => {
    const nextRole = member.role === 'admin' ? 'member' : 'admin';
    setWorkingUserId(member.userId);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/groups/${groupId}/member`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.userId, role: nextRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update this member.');
      setNotice(`${member.user?.name || 'Member'} is now a ${nextRole}.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this member.');
    } finally {
      setWorkingUserId(null);
    }
  };

  const removeMember = async (member: Member) => {
    if (!window.confirm(`Remove ${member.user?.name || 'this member'} from ${groupName}?`)) return;
    setWorkingUserId(member.userId);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/groups/${groupId}/member`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove this member.');
      setNotice(`${member.user?.name || 'Member'} was removed from the group.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove this member.');
    } finally {
      setWorkingUserId(null);
    }
  };

  return (
    <main className="page-container min-h-[calc(100dvh-4.5rem)] py-5 sm:py-8">
      <Link href={`/groups/${groupId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to group</Link>
      <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/10 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Group access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Members & permissions</h1>
          <p className="mt-2 text-sm text-white/75">Manage who belongs to {groupName} and what they can do.</p>
        </div>
        {canManage && <div className="w-full sm:w-44"><AddMemberModal groupId={groupId} token={token} /></div>}
      </header>

      <section className="surface-card mb-6 p-4 sm:p-6" aria-labelledby="permissions-heading">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><ShieldCheck className="size-5" /></span><div><h2 id="permissions-heading" className="font-semibold">Role permissions</h2><p className="text-sm text-muted-foreground">Permissions apply to every member in this group.</p></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <div className="flex items-center gap-2 font-semibold"><Crown className="size-4 text-primary" /> Admin</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Invite and remove members, approve join requests, change group settings, manage roles, and add, edit, or remove expenses.</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center gap-2 font-semibold"><UserRound className="size-4 text-muted-foreground" /> Member</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">View group activity and settlement, and add expenses. Members cannot manage access, group settings, or edit and remove expenses.</p>
          </div>
        </div>
      </section>

      {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">{notice}</p>}

      <section aria-labelledby="members-heading">
        <div className="mb-3 flex items-end justify-between"><div><p className="eyebrow">People in this group</p><h2 id="members-heading" className="mt-1 text-xl font-semibold">Members <span className="text-base font-normal text-muted-foreground">({members.length})</span></h2></div></div>
        {members.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {members.map((member) => {
              const name = member.user?.name || 'Unknown member';
              const isLastAdmin = member.role === 'admin' && adminsCount <= 1;
              return (
                <li key={member.id} className="surface-card flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">{name.slice(0, 1).toUpperCase()}</span>
                    <div className="min-w-0"><p className="truncate font-semibold">{name}</p><p className="truncate text-sm text-muted-foreground">{member.user?.email || 'Group member'}</p></div>
                    <span className={`ml-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${member.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {member.role === 'admin' ? <Crown className="size-3" /> : <UserRound className="size-3" />}{member.role}
                    </span>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-2 sm:justify-end">
                      <Button type="button" size="sm" variant="outline" disabled={workingUserId !== null || isLastAdmin} title={isLastAdmin ? 'A group must have at least one admin' : undefined} onClick={() => updateRole(member)} className="min-w-32 rounded-xl">
                        <UserRoundCog className="size-4" />{workingUserId === member.userId ? 'Saving…' : member.role === 'admin' ? 'Make member' : 'Make admin'}
                      </Button>
                      <Button type="button" size="icon" variant="outline" aria-label={`Remove ${name}`} disabled={workingUserId !== null || isLastAdmin} title={isLastAdmin ? 'The last admin cannot be removed' : undefined} onClick={() => removeMember(member)} className="shrink-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <UserRoundX className="size-4" />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <div className="surface-card p-8 text-center text-sm text-muted-foreground">There are no members in this group yet.</div>}
      </section>
    </main>
  );
}
