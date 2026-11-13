import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';

const base = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
  JWT_SECRET: 'x'.repeat(32),
};

describe('loadConfig', () => {
  it('applies defaults and coerces numbers', () => {
    const config = loadConfig({ ...base, PORT: '8081' });
    expect(config.PORT).toBe(8081);
    expect(config.NODE_ENV).toBe('development');
    expect(config.BCRYPT_ROUNDS).toBe(12);
  });

  it('rejects a short JWT secret with a readable message', () => {
    expect(() => loadConfig({ ...base, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET must be at least 32/,
    );
  });

  it('rejects a non-Postgres database URL', () => {
    expect(() => loadConfig({ ...base, DATABASE_URL: 'mysql://localhost/app' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('parses TRUST_PROXY as a hop count, defaulting to no trusted proxies', () => {
    expect(loadConfig(base).TRUST_PROXY).toBe(0);
    expect(loadConfig({ ...base, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
    expect(() => loadConfig({ ...base, TRUST_PROXY: 'true' })).toThrow(/TRUST_PROXY/);
  });

  it('requires DATABASE_URL', () => {
    expect(() => loadConfig({ JWT_SECRET: base.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });
});
