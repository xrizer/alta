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

  const changePage = (next: number) => {
    const safe = Math.min(Math.max(next, 1), totalPages);
    if (safe !== page) onChange(safe);
  };

  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious onClick={() => changePage(page - 1)} />
          </PaginationItem>
        )}

        {pages.map((p, idx) => (
          <PaginationItem key={idx}>
            {p === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={p === page}
                onClick={() => changePage(p)}>
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {page < totalPages && (
          <PaginationItem>
            <PaginationNext onClick={() => changePage(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
