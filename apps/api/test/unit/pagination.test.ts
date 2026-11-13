import { describe, expect, it } from 'vitest';
import { buildPageMeta, pageOffset } from '../../src/lib/pagination.js';

describe('pagination', () => {
  it('computes the row offset for a page', () => {
    expect(pageOffset(1, 20)).toBe(0);
    expect(pageOffset(3, 20)).toBe(40);
  });

  it('rounds total pages up', () => {
    expect(buildPageMeta(1, 20, 41)).toEqual({ page: 1, pageSize: 20, total: 41, totalPages: 3 });
  });

  it('reports zero pages for an empty result', () => {
    expect(buildPageMeta(1, 20, 0).totalPages).toBe(0);
  });
});
