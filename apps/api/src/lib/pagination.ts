export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function pageOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function buildPageMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
