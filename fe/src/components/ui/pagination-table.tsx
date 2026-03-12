import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

type PageItem = number | 'ellipsis';

const getPageRange = (
  current: number,
  total: number,
  delta = 1,
): PageItem[] => {
  const range: PageItem[] = [];

  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);

  if (left > 2) range.push('ellipsis');

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  if (right < total - 1) range.push('ellipsis');

  if (total > 1) range.push(total);

  return range;
};

export function TablePagination({
  page,
  totalPages,
  onChange,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onChange(page - 1)}
            aria-disabled={page === 1}
          />
        </PaginationItem>

        {/* Pages */}
        {pages.map((p, idx) => (
          <PaginationItem key={idx}>
            {p === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink isActive={p === page} onClick={() => onChange(p)}>
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            onClick={() => onChange(page + 1)}
            aria-disabled={page === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
