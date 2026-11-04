'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ArrowLeft, KeyRound, Monitor, Moon, Save, Sun, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/Loader';

interface Account {
  name: string;
  email: string;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [account, setAccount] = useState<Account>({ name: '', email: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
    fetch('/api/account')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load your account.');
        setAccount({ name: data.user.name || '', email: data.user.email || '' });
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load your account.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...account, currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save your settings.');
      setAccount({ name: data.user.name, email: data.user.email });
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Your account settings have been saved.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container py-6 sm:py-12">
      <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" /> Dashboard</Link>
      <div className="mb-7">
        <p className="eyebrow">Personal preferences</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">Account settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your profile and sign-in details.</p>
      </div>

      <form onSubmit={handleSave} className="surface-card max-w-3xl p-4 sm:p-8">
        <section className="border-b border-border/70 pb-5" aria-labelledby="appearance-heading">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Sun className="size-5 dark:hidden" /><Moon className="hidden size-5 dark:block" /></span>
            <div className="min-w-0"><h2 id="appearance-heading" className="font-semibold">Appearance</h2><p className="text-sm text-muted-foreground">Choose light or dark mode for the app.</p></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Color theme">
            {([
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
              { value: 'system', label: 'System', Icon: Monitor },
            ] as const).map(({ value, label, Icon }) => (
              <Button key={value} type="button" variant={mounted && theme === value ? 'default' : 'outline'} className={`h-11 min-w-0 gap-2 rounded-xl px-3 text-sm sm:px-4 ${value === 'system' ? 'col-span-2 sm:col-span-1' : ''}`} aria-pressed={mounted && theme === value} onClick={() => setTheme(value)}>
                <Icon className="size-4 shrink-0" /><span>{label}</span>
              </Button>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3 border-b border-border/70 pb-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><UserRound className="size-5" /></span>
          <div className="min-w-0"><h2 className="font-semibold">Profile information</h2><p className="text-sm text-muted-foreground">Your name and email used for Splitbill.</p></div>
        </div>

        {loading ? <Loader label="Loading account settings" className="min-h-48" /> : (
          <>
            <div className="grid gap-4 py-5 sm:grid-cols-2 sm:gap-5 sm:py-6">
              <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">Full name
                <input className="field-control" autoComplete="name" maxLength={80} required value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
              </label>
              <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">Email address
                <input className="field-control" type="email" autoComplete="email" required value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} />
              </label>
            </div>

            <div className="flex items-center gap-3 border-y border-border/70 py-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><KeyRound className="size-5" /></span>
              <div className="min-w-0"><h2 className="font-semibold">Change password</h2><p className="text-sm text-muted-foreground">Leave blank if you don&apos;t want to change it.</p></div>
            </div>
            <div className="grid gap-4 py-5 sm:grid-cols-2 sm:gap-5 sm:py-6">
              <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">Current password
                <input className="field-control" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              </label>
              <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">New password
                <input className="field-control" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </label>
            </div>
          </>
        )}

        {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        {success && <p role="status" className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">{success}</p>}
        <div className="flex justify-end border-t border-border/70 pt-5"><Button type="submit" disabled={loading || saving} className="w-full rounded-xl sm:w-auto"><Save className="size-4" />{saving ? 'Saving…' : 'Save changes'}</Button></div>
      </form>
    </div>
  );
}
