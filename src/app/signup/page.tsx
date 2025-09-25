'use client';

import { useState } from 'react';
import AuthForm from '../../components/AuthForm';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (formData: any) => {
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
         <div className="w-full max-w-md p-8 space-y-8 rounded-lg shadow-md bg-background dark:bg-background">
           <h1 className="text-2xl font-bold text-center">Login</h1>
            <AuthForm mode="signup" onSubmit={handleSubmit} />
           {error && <p className="text-destructive dark:test-destructive text-center">{error}</p>}
         </div>
       </div>
  );
}


 