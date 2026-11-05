'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, CircleDollarSign, LogOut, Settings, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SiteHeaderProps {
  isAuthenticated: boolean;
  firstName?: string;
}

export function SiteHeader({ isAuthenticated, firstName = '' }: SiteHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setProfileOpen(false);
      window.location.replace('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="page-container flex h-[4.5rem] items-center justify-between">
        <Link href="/" className="group flex items-center gap-3" aria-label="Splitbill home">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:rotate-[-5deg]">
            <CircleDollarSign className="size-5" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight">splitbill</span>
            <span className="hidden text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">shared, simply</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {!isAuthenticated && (
            <nav className="flex items-center gap-0.5 text-xs font-medium sm:gap-2 sm:text-sm" aria-label="Main navigation">
              <Link href="/login" className="whitespace-nowrap rounded-full px-2.5 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-3">Log in</Link>
              <Link href="/signup" className="inline-flex whitespace-nowrap items-center gap-1 rounded-full bg-primary px-3 py-2 text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-4">
                Get started <ArrowUpRight className="size-3.5" />
              </Link>
            </nav>
          )}
          {isAuthenticated && <span className="hidden h-7 w-px bg-border sm:block" />}
          {isAuthenticated && (
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="group flex min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={firstName ? `Open ${firstName}'s profile menu` : 'Open profile menu'}
                >
                  <span className="grid size-9 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors group-hover:border-primary/40">
                    <UserRound className="size-[1.1rem]" />
                  </span>
                  <span className="max-w-20 truncate text-[0.65rem] font-semibold leading-tight">{firstName || 'Profile'}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-popover p-6">
                <DialogHeader className="items-center text-center">
                  <span className="mb-2 grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><UserRound className="size-6" /></span>
                  <DialogTitle className="text-xl">Your profile</DialogTitle>
                  <DialogDescription>Manage your Splitbill account.</DialogDescription>
                </DialogHeader>
                <div className="mt-3 grid gap-2">
                  <Button asChild variant="outline" className="h-11 justify-start rounded-xl" onClick={() => setProfileOpen(false)}>
                    <Link href="/settings/account"><Settings className="size-4" /> Account settings</Link>
                  </Button>
                  <Button onClick={handleLogout} disabled={isLoggingOut} variant="destructive" className="h-11 justify-start rounded-xl">
                    <LogOut className="size-4" /> {isLoggingOut ? 'Signing out…' : 'Log out'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
