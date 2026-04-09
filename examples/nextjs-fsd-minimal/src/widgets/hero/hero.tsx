import { SignupForm } from '@/features/newsletter-signup';

export function Hero() {
  return (
    <section>
      <h1>forge FSD minimal</h1>
      <p>Illustrates slice boundaries and public-API-only imports.</p>
      <SignupForm />
    </section>
  );
}
