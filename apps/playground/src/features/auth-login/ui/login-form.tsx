'use client';

import { useState } from 'react';

import { Button } from '@/shared/ui/button';

import { createLoginCommand } from '../model/login-command';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  async function handleSubmit() {
    setStatus('submitting');
    await createLoginCommand(email, password);
    setStatus('done');
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
      />
      <Button type="submit">{status === 'submitting' ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  );
}
