'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LeaveGroupButton } from './LeaveGroupButton';
import { CreateGroupModal } from '@/components/CreateGroupModal';

interface Group {
  id: string;
  name: string;
}

interface HomePageClientProps {
  initialUserId: string | null;
  initialJoinedGroups: Group[];
  initialAvailableGroups: Group[];
  token: string;
}

export default function HomePageClient({ 
  initialUserId,
  initialJoinedGroups,
  initialAvailableGroups,
  token
}: HomePageClientProps) {
  const [userId, setUserId] = useState(initialUserId);
  const [joinedGroups, setJoinedGroups] = useState(initialJoinedGroups);
  const [availableGroups, setAvailableGroups] = useState(initialAvailableGroups);
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUserId(null);
      setJoinedGroups([]);
      setAvailableGroups([]);
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  const joinedGroupOnClickHandler = async (id: string) => {
    router.push(`/groups/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-16 bg-background text-foreground">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Welcome</h1>
        {userId ? (
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>

      {userId && (
        <div>
          {userId && (
            <p className="mb-8 text-muted-foreground">
              User ID: {userId}
            </p>
          )}

          {/* Create Group Section */}
          <div className="mb-8 bg-card border border-border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-card-foreground">Create a New Group</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new group to track expenses with friends, family, or colleagues.
            </p>
            <CreateGroupModal token={token} />
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Joined Groups</h2>
            {initialJoinedGroups.length > 0 ? (
              <ul className="space-y-2">
                {joinedGroups.map((group) => (
                  <li
                    key={group.id}
                    className="flex justify-between items-center p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => joinedGroupOnClickHandler(group.id)}
                  >
                    <span className="text-card-foreground">{group.name}</span>
                    {userId && <LeaveGroupButton groupId={group.id} userId={userId} token={token} />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                You haven&apos;t joined any groups yet.
              </p>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Available Groups</h2>
            {availableGroups.length > 0 ? (
              <ul className="space-y-2">
                {availableGroups.map((group) => (
                  <li
                    key={group.id}
                    className="flex justify-between items-center p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <span className="text-card-foreground">{group.name}</span>
                    <Button onClick={() => handleJoinGroup(group.id)}>Join</Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                No other groups available to join.
              </p>
            )}
          </div>
        </div>
      )}

      {!userId && (
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-8">
            Please login to see your groups.
          </p>
        </div>
      )}
    </div>
  );
}