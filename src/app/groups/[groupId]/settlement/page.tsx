import React from 'react';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CircleDollarSign, Scale, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/currencies';

interface Balance {
  userId: string;
  userName: string;
  balance: number;
}

interface Settlement {
  fromUser: string;
  toUser: string;
  amount: number;
}

interface SettlementData {
  totalExpense: number;
  currency?: string;
  balances: Balance[];
  settlements: Settlement[];
}

async function getSettlementData(groupId: string, token: string): Promise<SettlementData | null> {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseURL}/api/groups/${groupId}/settlement`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch settlement data: ${response.status} ${response.statusText}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching settlement data:', error);
    return null;
  }
}

const SettlementPage = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value || "";

  const settlementData = await getSettlementData(groupId, token);
  const currency = settlementData?.currency || 'INR';

  if (!settlementData) {
    return (
      <div className="page-container py-12">
        <div className="surface-card mx-auto max-w-xl px-6 py-12 text-center sm:px-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Scale className="size-6" /></span>
          <p className="eyebrow mt-6">Settlement summary</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">We couldn&apos;t load this yet</h1>
          <p className="mt-3 text-muted-foreground">The group settlement is temporarily unavailable. Please try again in a moment.</p>
          <div className="mt-7"><Button asChild className="rounded-xl"><Link href={`/groups/${groupId}`}><ArrowLeft className="size-4" /> Back to group</Link></Button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-9 sm:py-12">
      <Link href={`/groups/${groupId}`} className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" /> Back to group</Link>
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-primary p-7 text-primary-foreground shadow-lg shadow-primary/10 sm:p-9">
        <div className="absolute -right-14 -top-32 -z-10 size-80 rounded-full border border-white/15" />
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Scale className="size-6" /></span>
          <div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">Fair and square</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Settlement summary</h1></div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-5 border-t border-white/20 pt-6 sm:flex-row sm:items-end">
          <div><p className="text-sm text-white/70">Total group expenses</p><p className="mt-1 text-4xl font-semibold tracking-tight">{formatCurrency(settlementData.totalExpense, currency)}</p></div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white/90"><CircleDollarSign className="size-4" /> Clear balances, easy payback</span>
        </div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Wallet className="size-5" /></span>
            <div><p className="eyebrow">Where you stand</p><h2 className="mt-1 text-xl font-semibold">Member balances</h2></div>
          </div>
          <ul className="mt-5 space-y-3">
            {settlementData.balances.map((balance) => (
              <li key={balance.userId} className="flex items-center justify-between gap-4 rounded-xl bg-muted/70 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-sm font-bold text-muted-foreground">{balance.userName.slice(0, 1).toUpperCase()}</span>
                  <span className="truncate font-medium">{balance.userName}</span>
                </div>
                <span className={`shrink-0 font-semibold tabular-nums ${balance.balance < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {balance.balance > 0 ? '+' : balance.balance < 0 ? '−' : ''}{formatCurrency(Math.abs(balance.balance), currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><ArrowRight className="size-5" /></span>
            <div><p className="eyebrow">The simplest way to settle</p><h2 className="mt-1 text-xl font-semibold">Suggested transfers</h2></div>
          </div>
          {settlementData.settlements.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {settlementData.settlements.map((settlement, index) => (
                <li key={`${settlement.fromUser}-${settlement.toUser}-${index}`} className="rounded-xl border border-border/80 bg-background/70 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">{settlement.fromUser}</span><span className="text-muted-foreground">pays</span><ArrowRight className="size-3.5 text-primary" /><span className="font-semibold">{settlement.toUser}</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-primary">{formatCurrency(settlement.amount, currency)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl bg-secondary/60 px-5 py-10 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-5" /></span>
              <p className="mt-3 font-semibold">Everyone is all settled</p>
              <p className="mt-1 text-sm text-muted-foreground">No transfers are needed right now.</p>
            </div>
          )}
        </section>
      </div>

      <div className="mt-7 flex justify-center"><Button asChild variant="outline" className="rounded-xl"><Link href={`/groups/${groupId}`}><ArrowLeft className="size-4" /> Back to group</Link></Button></div>
    </div>
  );
};

export default SettlementPage;
