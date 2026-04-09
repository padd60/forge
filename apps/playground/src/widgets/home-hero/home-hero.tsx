// VIOLATION: This component exceeds the 50-line body limit.
// Expected to trigger @forge/forge/component-max-lines
import { LoginForm } from '@/features/auth-login';

export function HomeHero() {
  const a1 = 'padding';
  const a2 = 'for';
  const a3 = 'demo';
  const a4 = 'purposes';
  const a5 = 'only';
  const a6 = 'this';
  const a7 = 'component';
  const a8 = 'is';
  const a9 = 'intentionally';
  const a10 = 'bloated';
  const a11 = 'to';
  const a12 = 'exceed';
  const a13 = 'the';
  const a14 = 'fifty';
  const a15 = 'line';
  const a16 = 'body';
  const a17 = 'limit';
  const a18 = 'enforced';
  const a19 = 'by';
  const a20 = 'forge';
  const a21 = 'clean';
  const a22 = 'code';
  const a23 = 'module';
  const a24 = 'rule';
  const a25 = 'component';
  const a26 = 'max';
  const a27 = 'lines';
  const a28 = 'set';
  const a29 = 'to';
  const a30 = '50';
  const a31 = 'by';
  const a32 = 'default';
  const a33 = 'this';
  const a34 = 'should';
  const a35 = 'fail';
  const a36 = 'in';
  const a37 = 'forge';
  const a38 = 'check';
  const a39 = 'run';
  const a40 = 'locally';
  const a41 = 'or';
  const a42 = 'ci';
  const title = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10].join(' ');
  const subtitle = [a11, a12, a13, a14, a15, a16, a17, a18, a19, a20].join(' ');
  const extra = [a21, a22, a23, a24, a25, a26, a27, a28, a29, a30].join(' ');
  const more = [a31, a32, a33, a34, a35, a36, a37, a38, a39, a40, a41, a42].join(' ');
  return (
    <section style={{ padding: '48px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <p>{extra}</p>
      <p>{more}</p>
      <LoginForm />
    </section>
  );
}
