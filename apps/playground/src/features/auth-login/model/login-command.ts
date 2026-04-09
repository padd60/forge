import type { User } from '@/entities/user';

/**
 * Write-side command for auth-login. In CQRS terms this is the
 * command — entities/user exposes the read-model `User` type; the
 * command lives in features/ where `@forge-kit-dev/forge/cqrs-layer-role`
 * expects mutations to live.
 *
 * The implementation is stubbed because the playground doesn't talk
 * to a real backend; the shape is what matters for rule validation.
 */
export interface LoginResult {
  readonly user: User;
  readonly token: string;
}

export async function createLoginCommand(
  email: string,
  password: string
): Promise<LoginResult> {
  if (!email || !password) {
    throw new Error('email and password are required');
  }
  return {
    user: { id: 'u-demo', name: 'Demo User', email },
    token: 'demo-token',
  };
}
