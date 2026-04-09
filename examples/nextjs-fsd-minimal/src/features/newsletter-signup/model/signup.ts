/**
 * Stubbed signup action. Real feature would call a backend; the
 * point of this example is to show that the feature exports its
 * public action from the slice's index.ts.
 */
export async function subscribeToNewsletter(email: string): Promise<void> {
  if (!email.includes('@')) {
    throw new Error('invalid email');
  }
  await Promise.resolve();
}
