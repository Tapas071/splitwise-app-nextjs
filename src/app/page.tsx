'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4 dark:text-white">Welcome to the App</h1>
      <p className="text-lg text-muted-foreground mb-8 dark:text-gray-400">This is a sample application with authentication.</p>
      {token ? (
        <div>
          <p className="mb-4 dark:text-gray-300">You are logged in.</p>
          <Button onClick={handleLogout} variant="destructive">Logout</Button>
        </div>
      ) : (
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
