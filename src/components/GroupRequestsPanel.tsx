'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BellRing, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GroupRequest {
  id: string;
  groupId: string;
  type: 'invitation' | 'join_request';
  message?: string;
  group?: { id: string; name: string } | null;
  requesterName?: string;
}

interface GroupRequestsPanelProps {
  groupId?: string;
}

export function GroupRequestsPanel({ groupId }: GroupRequestsPanelProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<GroupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/group-requests');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load group requests.');
      setRequests(data.requests || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load group requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadRequests(); }, []);

  const respond = async (request: GroupRequest, action: 'accept' | 'decline' | 'approve' | 'reject') => {
    setWorkingId(request.id);
    setError('');
    try {
      const response = await fetch(`/api/group-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update this request.');
      await loadRequests();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this request.');
    } finally {
      setWorkingId(null);
    }
  };

  const visibleRequests = groupId ? requests.filter((request) => request.groupId === groupId) : requests;
  if (!loading && visibleRequests.length === 0 && !error) return null;

  return (
    <section className="surface-card p-5 sm:p-6" aria-label="Group invitations and requests">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><BellRing className="size-5" /></span>
        <div><p className="eyebrow">Group access</p><h2 className="mt-1 text-xl font-semibold">Invitations & requests</h2></div>
      </div>
      {error && <p role="alert" className="mb-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {loading ? <p className="text-sm text-muted-foreground">Loading requests…</p> : (
        <ul className="space-y-3">
          {visibleRequests.map((request) => {
            const invitation = request.type === 'invitation';
            const approveAction = invitation ? 'accept' : 'approve';
            const rejectAction = invitation ? 'decline' : 'reject';
            return (
              <li key={request.id} className="rounded-xl border border-border/80 bg-background/70 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="font-medium">{invitation ? `${request.requesterName || 'A group admin'} invited you to` : `${request.requesterName || 'A member'} requested to join`} <Link className="text-primary hover:underline" href={`/groups/${request.groupId}`}>{request.group?.name || 'a group'}</Link></p>
                    {request.message && <p className="mt-2 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground">“{request.message}”</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" className="rounded-lg" disabled={workingId !== null} onClick={() => respond(request, approveAction)}><Check className="size-4" />{invitation ? 'Accept' : 'Approve'}</Button>
                    <Button size="sm" variant="outline" className="rounded-lg" disabled={workingId !== null} onClick={() => respond(request, rejectAction)}><X className="size-4" />{invitation ? 'Decline' : 'Reject'}</Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
