'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LeaveGroupButton } from './LeaveGroupButton';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { BrowseGroupsDialog } from '@/components/BrowseGroupsDialog';
import { ArrowRight, Plus, UsersRound, WalletCards } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  currency?: string;
}

interface HomePageClientProps {
  initialUserId: string | null;
  initialUserName: string | null;
  initialJoinedGroups: Group[];
  initialAvailableGroups: Group[];
  token: string;
}

export default function HomePageClient({
  initialUserId,
  initialUserName,
  initialJoinedGroups,
  initialAvailableGroups,
  token
}: HomePageClientProps) {
  const [userId, setUserId] = useState(initialUserId);
  const [userName, setUserName] = useState(initialUserName);
  const [joinedGroups, setJoinedGroups] = useState(initialJoinedGroups);
  const [availableGroups, setAvailableGroups] = useState(() => {
    const joinedGroupIds = new Set(initialJoinedGroups.map(group => group.id));
    return initialAvailableGroups.filter(group => !joinedGroupIds.has(group.id));
  });
  useEffect(() => {
    setUserId(initialUserId);
    setUserName(initialUserName);
    setJoinedGroups(initialJoinedGroups);
    const joinedGroupIds = new Set(initialJoinedGroups.map(group => group.id));
    setAvailableGroups(initialAvailableGroups.filter(group => !joinedGroupIds.has(group.id)));
  }, [initialUserId, initialUserName, initialJoinedGroups, initialAvailableGroups]);
  
  return (
    <div className="page-container py-10 sm:py-14">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-9 text-primary-foreground shadow-xl shadow-primary/10 sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-32 -z-10 size-96 rounded-full border border-white/15" />
        <div className="absolute -bottom-48 right-24 -z-10 size-[30rem] rounded-full border border-white/10" />
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/90"><WalletCards className="size-4" /> SHARED EXPENSES, SIMPLIFIED</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{userId ? `Good to have you${userName ? `, ${userName}` : ''}.` : 'Make sharing expenses feel easy.'}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">Keep plans, people, and payments together. Split fairly, stay in sync, and spend more time enjoying the moment.</p>
          </div>
          {!userId && (
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button asChild variant="secondary" className="rounded-xl"><Link href="/signup">Get started <ArrowRight className="size-4" /></Link></Button>
              <Button asChild variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href="/login">Log in</Link></Button>
            </div>
          )}
        </div>
      </section>

      {userId ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-8">
            <div>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Your circles</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Joined groups</h2>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">{joinedGroups.length} {joinedGroups.length === 1 ? 'group' : 'groups'}</span>
              </div>
              {joinedGroups.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {joinedGroups.map((group) => (
                    <li key={group.id} className="surface-card group flex min-h-32 flex-col justify-between p-5 transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
                      <Link href={`/groups/${group.id}`} className="flex items-start justify-between gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><UsersRound className="size-5" /></span>
                        <ArrowRight className="mt-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </Link>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/groups/${group.id}`} className="block truncate font-semibold tracking-tight hover:text-primary">{group.name}</Link>
                          <span className="mt-1 block text-xs text-muted-foreground">Currency · {group.currency || 'INR'}</span>
                        </div>
                        {userId && <span onClick={(event) => event.stopPropagation()}><LeaveGroupButton groupId={group.id} userId={userId} token={token} /></span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="surface-card flex flex-col items-center px-6 py-10 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><UsersRound className="size-5" /></span>
                  <p className="mt-4 font-semibold">Your groups will show up here</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create a group or join one to start sharing expenses.</p>
                </div>
              )}
            </div>

            <section className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="eyebrow">Find your people</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Looking for a group?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Browse available groups and search by name.</p>
              </div>
              <BrowseGroupsDialog groups={availableGroups} userId={userId} />
            </section>
          </section>

          <aside className="h-fit rounded-[1.5rem] border border-primary/15 bg-card p-6 shadow-sm sm:p-7">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><Plus className="size-5" /></span>
            <p className="eyebrow mt-6">Start something new</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Create a group</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">For the weekend away, the shared apartment, or just dinner with friends.</p>
            <div className="mt-6"><CreateGroupModal token={token} /></div>
          </aside>
        </div>
      ) : (
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            ['01', 'Create a group', 'Set up a space for your trip, home, or crew.'],
            ['02', 'Add expenses', 'Everyone can see what was paid and by whom.'],
            ['03', 'Settle simply', 'Know exactly who owes what—no awkward math.'],
          ].map(([number, title, description]) => (
            <div key={number} className="surface-card p-5">
              <span className="eyebrow">{number}</span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}