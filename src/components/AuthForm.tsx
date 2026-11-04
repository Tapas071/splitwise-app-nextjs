import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface AuthFormData {
  name?: string;
  email: string;
  password: string;
}

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (formData: AuthFormData) => void;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {mode === 'signup' && (
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-semibold">Your name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="field-control" autoComplete="name" required />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold">Email address</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="field-control" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold">Password</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="field-control" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
      </div>
      <button type="submit" className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30">
        {mode === 'login' ? 'Log in' : 'Create account'} <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
