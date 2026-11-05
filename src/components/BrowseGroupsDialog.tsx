'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Compass, Search, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Group {
  id: string;
  name: string;
  currency?: string;
}

interface BrowseGroupsDialogProps {
  groups: Group[];
  userId: string;
}

export function BrowseGroupsDialog({ groups, userId }: BrowseGroupsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sentGroupIds, setSentGroupIds] = useState<Set<string>>(new Set());

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return groups;
    return groups.filter((group) => group.name.toLocaleLowerCase().includes(normalizedQuery));
  }, [groups, query]);

  const handleJoin = async (groupId: string) => {
    setJoiningId(groupId);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/groups/${groupId}/member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Could not join this group. Please try again.');
      }
      setSentGroupIds((current) => new Set(current).add(groupId));
      setNotice('Your join request was sent to the group admins.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not join this group. Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between rounded-2xl px-4 py-6 sm:w-auto sm:min-w-64">
          <span className="flex items-center gap-3 text-left">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Compass className="size-5" /></span>
            <span><span className="block font-semibold">Browse groups</span><span className="mt-0.5 block text-xs font-normal text-muted-foreground">Find a group to join</span></span>
          </span>
          <span className="ml-4 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{groups.length}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden rounded-2xl border-border bg-popover p-4 sm:max-w-lg sm:p-6">
        <DialogHeader className="shrink-0 pr-7">
          <DialogTitle className="flex items-center gap-2 text-xl"><UsersRound className="size-5 text-primary" /> Find a group</DialogTitle>
          <DialogDescription>Search public groups and request to join.</DialogDescription>
        </DialogHeader>
        {notice && <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>}

        <label className="relative mt-2 block shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search groups by name..."
            aria-label="Search groups by name"
            className="field-control pl-10"
          />
        </label>

        <p className="shrink-0 text-xs text-muted-foreground" aria-live="polite">
          {filteredGroups.length} {filteredGroups.length === 1 ? 'group' : 'groups'} found
        </p>

        {error && <p role="alert" className="shrink-0 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {filteredGroups.length > 0 ? (
            <ul className="space-y-2 pb-1">
              {filteredGroups.map((group) => (
                <li key={group.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/70 p-3 sm:p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><UsersRound className="size-5" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{group.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Public · Currency {group.currency || 'INR'}</p>
                    </div>
                  </div>
                  <Button onClick={() => handleJoin(group.id)} disabled={joiningId !== null || sentGroupIds.has(group.id)} size="sm" className="shrink-0 rounded-xl">
                    {joiningId === group.id ? 'Sending…' : sentGroupIds.has(group.id) ? 'Requested' : <>Request <ArrowRight className="size-3.5" /></>}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid min-h-40 place-items-center rounded-xl bg-muted/50 px-5 py-8 text-center">
              <div><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 font-medium">No groups found</p><p className="mt-1 text-sm text-muted-foreground">Try another name or check back later.</p></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
