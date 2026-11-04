'use client';

import { useState } from 'react';
import AuthForm from '../../components/AuthForm';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');

  const handleSubmit = async (formData: any) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        window.location.replace('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  return (
    <div className="page-container flex min-h-[calc(100vh-4.5rem)] items-center justify-center py-12">
      <section className="surface-card grid w-full max-w-5xl overflow-hidden md:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
          <div className="absolute -right-24 -top-20 size-72 rounded-full border border-white/15" />
          <div className="absolute -bottom-28 -left-20 size-80 rounded-full border border-white/15" />
          <div className="relative inline-flex size-12 items-center justify-center rounded-2xl bg-white/15"><Sparkles className="size-6" /></div>
          <div className="relative max-w-sm">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Good to see you</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">Your people. Your plans. One clear tab.</h2>
            <p className="mt-5 leading-7 text-white/75">Pick up where your group left off and keep every shared expense in balance.</p>
          </div>
          <p className="relative text-sm text-white/65">Less chasing. More living.</p>
        </div>
        <div className="p-7 sm:p-10 md:p-12">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Log in to Splitbill</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Manage your shared expenses and settle up with ease.</p>
          <div className="mt-8">
            <AuthForm mode="login" onSubmit={handleSubmit} />
            {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          </div>
          <p className="mt-7 text-center text-sm text-muted-foreground">New to Splitbill? <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></p>
        </div>
      </section>
    </div>
  );
}
