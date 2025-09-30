export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export type SortField = {
  field: string;
  direction: 'asc' | 'desc';
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query: PaginationQuery): ParsedPagination {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function parseSort(sort?: string): SortField[] {
  if (!sort) {
    return [];
  }

  return sort.split(',').reduce<SortField[]>((acc, part) => {
    const [field, direction] = part.split('.');
    if (!field) {
      return acc;
    }

    const dir = direction === 'desc' ? 'desc' : 'asc';
    acc.push({ field, direction: dir });
    return acc;
  }, []);
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  const pageCount = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    pageCount,
    hasNextPage: page < pageCount,
    hasPrevPage: page > 1,
  };
}
