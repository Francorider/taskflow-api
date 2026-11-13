import type { PageMeta } from '../api/types';

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null;
  const first = (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__summary">
        {first}–{last} of {meta.total}
      </span>
      <div className="pagination__buttons">
        <button
          type="button"
          className="button button--ghost"
          disabled={meta.page <= 1}
          onClick={() => {
            onPageChange(meta.page - 1);
          }}
        >
          Previous
        </button>
        <span className="pagination__page">
          Page {meta.page} of {meta.totalPages}
        </span>
        <button
          type="button"
          className="button button--ghost"
          disabled={meta.page >= meta.totalPages}
          onClick={() => {
            onPageChange(meta.page + 1);
          }}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
