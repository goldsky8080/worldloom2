import { z } from 'zod';
import type { AuthGateway, Session, SignupInput } from '../../core/gateway/interfaces';
const sessionSchema = z.object({
  accountId: z.string(),
  nickname: z.string(),
  email: z.string().email(),
  verified: z.boolean(),
});
/** Mock only: credentials never leave the browser and are not persisted. */
export class MockAuthGateway implements AuthGateway {
  constructor(private authenticated: () => void = () => {}) {}
  private accounts = new Map<string, { password: string; session: Session }>([
    [
      'demo@living.world',
      {
        password: 'demo1234',
        session: {
          accountId: 'demo-account',
          nickname: 'Aerin',
          email: 'demo@living.world',
          verified: true,
        },
      },
    ],
  ]);
  private session: Session | null = null;
  private wait = () => new Promise<void>((resolve) => setTimeout(resolve, 200));
  async getSession() {
    if (this.session) return this.session;
    try {
      const raw = sessionStorage.getItem('lw.mock.session');
      this.session = raw ? sessionSchema.parse(JSON.parse(raw)) : null;
    } catch {
      this.session = null;
    }
    return this.session;
  }
  private save(session: Session) {
    this.session = session;
    try {
      sessionStorage.setItem('lw.mock.session', JSON.stringify(session));
    } catch {
      /* In-memory session still works. */
    }
    return session;
  }
  async login(email: string, password: string) {
    await this.wait();
    const account = this.accounts.get(email.trim().toLowerCase());
    if (!account || account.password !== password) throw new Error('auth.invalidCredentials');
    this.authenticated();
    return this.save(account.session);
  }
  async signup(input: SignupInput) {
    await this.wait();
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        nickname: z.string().trim().min(2).max(20),
        language: z.string(),
        terms: z.literal(true),
      })
      .safeParse(input);
    if (!parsed.success) throw new Error('auth.invalid');
    const email = input.email.toLowerCase();
    if (this.accounts.has(email)) throw new Error('auth.exists');
    const session = {
      accountId: crypto.randomUUID(),
      nickname: input.nickname,
      email,
      verified: false,
    };
    this.accounts.set(email, { password: input.password, session });
    this.authenticated();
    return this.save(session);
  }
  async resetPassword(email: string) {
    await this.wait();
    if (!z.string().email().safeParse(email).success) throw new Error('auth.invalid');
  }
  async verifyEmail() {
    await this.wait();
    if (!this.session) throw new Error('auth.expired');
    const session = this.save({ ...this.session, verified: true });
    const account = this.accounts.get(session.email);
    if (account) account.session = session;
    return session;
  }
  async logout() {
    this.session = null;
    try {
      sessionStorage.removeItem('lw.mock.session');
    } catch {
      /* No stored session. */
    }
  }
}
