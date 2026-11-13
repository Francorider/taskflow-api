import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { users, type UserRow } from '../../db/schema.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  isUniqueViolation,
} from '../../lib/errors.js';
import type { RegisterInput } from './auth.schemas.js';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  private timingGuardHash: string | undefined;

  constructor(
    private readonly db: Database,
    private readonly bcryptRounds: number,
  ) {}

  async register(input: RegisterInput): Promise<UserRow> {
    const passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);
    try {
      const [user] = await this.db
        .insert(users)
        .values({ email: normalizeEmail(input.email), name: input.name, passwordHash })
        .returning();
      if (!user) throw new Error('Insert returned no row');
      return user;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError('An account with this email already exists');
      throw error;
    }
  }

  async verifyCredentials(email: string, password: string): Promise<UserRow> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, normalizeEmail(email)),
    });
    // Compare against a throwaway hash when the user is unknown, so response time
    // does not reveal which emails are registered.
    const hash = user?.passwordHash ?? (await this.getTimingGuardHash());
    const valid = await bcrypt.compare(password, hash);
    if (!user || !valid)
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    return user;
  }

  async getById(id: string): Promise<UserRow> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  private async getTimingGuardHash(): Promise<string> {
    this.timingGuardHash ??= await bcrypt.hash('timing-guard', this.bcryptRounds);
    return this.timingGuardHash;
  }
}
