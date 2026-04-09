'use client';

import { useState } from 'react';

// VIOLATION: deep import bypassing another slice's public API
// This should trigger @forge/forge/fsd-slice-boundary
import { Hero } from '@/widgets/hero/hero';
import { Button } from '@/shared/ui/button';

import { subscribeToNewsletter } from '../model/signup';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    await subscribeToNewsletter(email);
    setDone(true);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <Button type="submit">{done ? 'Thanks' : 'Subscribe'}</Button>
    </form>
  );
}
