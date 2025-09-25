import { useState } from 'react';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (formData: any) => void;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [formData, setFormData] = useState({
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'signup' && (
        <div className="flex flex-col ">
          <label htmlFor="name" className="mb-1">Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="p-2 border rounded" />
        </div>
      )}
      <div className="flex flex-col">
        <label htmlFor="email" className="mb-1">Email</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="p-2 border rounded" />
      </div>
      <div className="flex flex-col">
        <label htmlFor="password" className="mb-1">Password</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="p-2 border rounded" />
      </div>
      <button type="submit" className="p-2 bg-secondary  dark:bg-secondary text-white dark:text-primary rounded hover:bg-blue-600">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
    </form>
  );
}
