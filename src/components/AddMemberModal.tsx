'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface AddMemberModalProps {
  groupId: string;
  token: string;
}

interface UserSearchResult {
  id: string;
  name: string;
}

export const AddMemberModal = ({ groupId, token }: AddMemberModalProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.length > 2) { // Only search if query is at least 3 characters long
      setIsSearching(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/users/search?name=${searchQuery}`);
          if (!res.ok) {
            throw new Error('Failed to search users');
          }
          const data: UserSearchResult[] = await res.json();
          setSearchResults(data);
        } catch (err) {
          console.error('Error searching users:', err);
          setError('Failed to search users.');
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500); // Debounce for 500ms
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user to add.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'invite', userId: selectedUser.id, message }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to send invitation. Please try again.');
      }

      // Reset form
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setMessage('');
      setOpen(false);

      // Refresh the page to show new member immediately
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member. Please try again.');
      console.error('Error adding member:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl">Add Member</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto bg-popover border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-popover-foreground">Add New Member</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Search for a user and send them an invitation message. They will join after accepting.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="userSearch" className="block text-sm font-medium mb-2 text-foreground">
              Search User by Name
            </label>
            <input
              id="userSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedUser(null); // Clear selected user on new search
              }}
              disabled={isLoading}
              className="field-control disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter user name"
            />
            {isSearching && searchQuery.length > 2 && (
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            )}
            {searchResults.length > 0 && !selectedUser && (
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-input bg-muted p-1">
                {searchResults.map((user) => (
                  <li
                    key={user.id}
                    className="cursor-pointer rounded-lg p-2.5 text-foreground transition-colors hover:bg-accent"
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery(user.name); // Display selected user's name in search box
                      setSearchResults([]); // Clear search results
                    }}
                  >
                    {user.name}
                  </li>
                ))}
              </ul>
            )}
            {selectedUser && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{selectedUser.name}</span>
              </p>
            )}
          </div>

          <label htmlFor="invitationMessage" className="block text-sm font-medium text-foreground">
            Invitation message (optional)
            <textarea
              id="invitationMessage"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              disabled={isLoading}
              className="field-control mt-2 min-h-20 resize-y"
              placeholder="Tell them why you are inviting them..."
            />
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedUser || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Member'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};