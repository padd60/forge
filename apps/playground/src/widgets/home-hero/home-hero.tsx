import { LoginForm } from '@/features/auth-login';

export function HomeHero() {
  return (
    <section style={{ padding: '48px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1>forge playground</h1>
      <p>
        Kitchen-sink demo with FSD, Clean Code, DDD, Clean Architecture, and CQRS all turned on.
      </p>
      <LoginForm />
    </section>
  );
}
