import { describe, expect, it } from 'vitest';
import { escapeLike, normalizeTags, parseTagFilter } from '../../src/modules/tasks/tasks.query.js';

describe('normalizeTags', () => {
  it('trims, lowercases and removes duplicates, keeping first-seen order', () => {
    expect(normalizeTags([' Backend', 'api', 'backend ', 'API'])).toEqual(['backend', 'api']);
  });

  it('drops empty entries', () => {
    expect(normalizeTags(['', '  ', 'ok'])).toEqual(['ok']);
  });
});

describe('parseTagFilter', () => {
  it('returns an empty list when the parameter is missing or blank', () => {
    expect(parseTagFilter(undefined)).toEqual([]);
    expect(parseTagFilter('')).toEqual([]);
    expect(parseTagFilter(' , ,')).toEqual([]);
  });

  it('splits a comma-separated list', () => {
    expect(parseTagFilter('bug, Frontend,bug')).toEqual(['bug', 'frontend']);
  });
});

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character itself', () => {
    expect(escapeLike('50%_done\\now')).toBe('50\\%\\_done\\\\now');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeLike('plain text')).toBe('plain text');
  });
});
