'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, Save, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CURRENCIES, formatCurrency } from '@/lib/currencies';

interface GroupSettingsFormProps {
  groupId: string;
  initialName: string;
  initialCurrency: string;
}

export function GroupSettingsForm({ groupId, initialName, initialCurrency }: GroupSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState(initialCurrency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/groups/${groupId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, currency }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save group settings.');
      setName(data.group.name);
      setCurrency(data.group.currency || 'INR');
      setSuccess('Group settings saved.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save group settings.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrency = CURRENCIES.find((item) => item.code === currency) || CURRENCIES[5];

  return (
    <div className="page-container py-9 sm:py-12">
      <Link href={`/groups/${groupId}`} className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" /> Back to group</Link>
      <div className="mb-7">
        <p className="eyebrow">Group preferences</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Group settings</h1>
        <p className="mt-2 text-muted-foreground">Choose how this group tracks shared expenses.</p>
      </div>

      <form onSubmit={handleSave} className="surface-card max-w-3xl p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b border-border/70 pb-5">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Settings2 className="size-5" /></span>
          <div><h2 className="font-semibold">Group details</h2><p className="text-sm text-muted-foreground">These preferences are shared with all members.</p></div>
        </div>
        <div className="grid gap-5 py-6 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">Group name
            <input className="field-control" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium">Group currency
            <select className="field-control" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {CURRENCIES.map((option) => <option key={option.code} value={option.code}>{option.code} — {option.name} ({option.symbol})</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
          <Coins className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Amounts will display in {currency} ({selectedCurrency.name})</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Example: {formatCurrency(1250, currency)}. Changing the currency changes how existing amounts are labeled; it does not convert or recalculate them. All group members can update this setting.</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">{success}</p>}
        <div className="mt-6 flex justify-end border-t border-border/70 pt-5"><Button type="submit" disabled={saving} className="rounded-xl"><Save className="size-4" />{saving ? 'Saving…' : 'Save settings'}</Button></div>
      </form>
    </div>
  );
}
