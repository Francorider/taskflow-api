import { describe, expect, it } from 'vitest';
import { parseTagInput } from './tags';

describe('parseTagInput', () => {
  it('normalises, slugifies and de-duplicates', () => {
    expect(parseTagInput(' Bug, front end ,bug,, ')).toEqual(['bug', 'front-end']);
  });

  it('returns an empty list for blank input', () => {
    expect(parseTagInput('   ')).toEqual([]);
  });
});
