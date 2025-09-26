'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Group {
  id: string;
  name: string;
}

interface HomePageClientProps {
  initialUserId: string | null;
  initialJoinedGroups: Group[];
  initialAvailableGroups: Group[];
}

export default function HomePageClient({ 
  initialUserId,
  initialJoinedGroups,
  initialAvailableGroups
}: HomePageClientProps) {
  const [userId, setUserId] = useState(initialUserId);
  const [joinedGroups, setJoinedGroups] = useState(initialJoinedGroups);
  const [availableGroups, setAvailableGroups] = useState(initialAvailableGroups);
  const router = useRouter();
  console.log("intialJoinedGroup",initialJoinedGroups)

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
      const res = await fetch(`/api/groups/${groupId}/add-member`, {
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

  const handleLeaveGroup = async (groupId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/delete-member`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold dark:text-white">Welcome</h1>
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
          {
            userId && <p className="mb-8 text-muted-foreground dark:text-gray-400">User ID: {userId}</p>
          }
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Joined Groups</h2>
            {joinedGroups.length > 0 ? (
              <ul className="space-y-2">
                {joinedGroups.map((group) => (
                  <li
                    key={group.id}
                    className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="dark:text-gray-300">{group.name}</span>
                    <Button
                      onClick={() => handleLeaveGroup(group.id)}
                      variant="destructive"
                    >
                      Leave
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground dark:text-gray-400">
                You haven't joined any groups yet.
              </p>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Available Groups</h2>
            {availableGroups.length > 0 ? (
              <ul className="space-y-2">
                {availableGroups.map((group) => (
                  <li
                    key={group.id}
                    className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="dark:text-gray-300">{group.name}</span>
                    <Button onClick={() => handleJoinGroup(group.id)}>Join</Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground dark:text-gray-400">
                No other groups available to join.
              </p>
            )}
          </div>
        </div>
      )}

      {!userId && (
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-8 dark:text-gray-400">
            Please login to see your groups.
          </p>
        </div>
      )}
    </div>
  );
}
