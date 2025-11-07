'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ApplicationStatus } from '@/lib/prisma-constants';

import { Input } from '@/components/ui/input';

import { AGE_BANDS, SORT_OPTIONS, STATUS_OPTIONS, type AgeBandValue, statusLabel } from './filter-constants';

type FilterFormProps = {
  defaultQuery: string;
  defaultStatus: ApplicationStatus | null;
  defaultSort: (typeof SORT_OPTIONS)[number];
  defaultAgeBand: AgeBandValue | null;
};

export function FilterForm({ defaultQuery, defaultStatus, defaultSort, defaultAgeBand }: FilterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [query, setQuery] = useState(defaultQuery);
  const [status, setStatus] = useState(defaultStatus ?? '');
  const [ageBand, setAgeBand] = useState(defaultAgeBand ?? '');
  const [sort, setSort] = useState(defaultSort);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    setStatus(defaultStatus ?? '');
  }, [defaultStatus]);

  useEffect(() => {
    setAgeBand(defaultAgeBand ?? '');
  }, [defaultAgeBand]);

  useEffect(() => {
    setSort(defaultSort);
  }, [defaultSort]);

  const commitParams = useCallback(
    (params: URLSearchParams) => {
      const next = params.toString();
      router.replace(`${pathname}${next ? `?${next}` : ''}`, { scroll: false });
    },
    [pathname, router],
  );

  const updateFilter = useCallback(
    (key: string, value: string, clearOn?: string) => {
      const params = new URLSearchParams(searchParamsString);
      if (!value || (clearOn && value === clearOn)) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      commitParams(params);
    },
    [commitParams, searchParamsString],
  );

  const handleStatusChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value;
      setStatus(nextValue);
      updateFilter('status', nextValue);
    },
    [updateFilter],
  );

  const handleAgeBandChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value;
      setAgeBand(nextValue);
      updateFilter('ageBand', nextValue);
    },
    [updateFilter],
  );

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value as (typeof SORT_OPTIONS)[number];
      setSort(nextValue);
      updateFilter('sort', nextValue, 'newest');
    },
    [updateFilter],
  );

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const rawQuery = formData.get('q');
      const params = new URLSearchParams(searchParamsString);
      if (typeof rawQuery === 'string' && rawQuery.trim()) {
        params.set('q', rawQuery.trim());
      } else {
        params.delete('q');
      }
      commitParams(params);
    },
    [commitParams, searchParamsString],
  );

  return (
    <form
      className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6 sm:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto] sm:items-end"
      method="get"
      onSubmit={handleSearchSubmit}
    >
      <div className="space-y-2">
        <label htmlFor="search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </label>
        <Input
          id="search"
          name="q"
          placeholder="Name, email, or note"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>
          Apply search
        </button>
      </div>
      <div className="space-y-2">
        <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={status}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          onChange={handleStatusChange}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="ageBand" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Age band
        </label>
        <select
          id="ageBand"
          name="ageBand"
          value={ageBand}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          onChange={handleAgeBandChange}
        >
          <option value="">All ages</option>
          {AGE_BANDS.map((band) => (
            <option key={band.value} value={band.value}>
              {band.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          value={sort}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
          onChange={handleSortChange}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A→Z</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="flex items-end">
        <Link
          href="/admin/applications"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
