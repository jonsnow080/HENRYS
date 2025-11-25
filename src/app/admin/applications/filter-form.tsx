"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@/lib/prisma-constants";
import { STATUS_OPTIONS, SORT_OPTIONS, AGE_BANDS, statusLabel, type AgeBandValue } from "./filters";

type FilterState = {
  query: string;
  status: string;
  ageBand: string;
  sort: (typeof SORT_OPTIONS)[number];
};

type SavedView = {
  key: string;
  label: string;
  description: string;
  filters: Partial<FilterState>;
};

export function FilterForm({
  defaultQuery,
  defaultStatus,
  defaultSort,
  defaultAgeBand,
}: {
  defaultQuery: string;
  defaultStatus: ApplicationStatus | null;
  defaultSort: (typeof SORT_OPTIONS)[number];
  defaultAgeBand: AgeBandValue | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(defaultQuery);
  const [status, setStatus] = useState(defaultStatus ?? "");
  const [ageBand, setAgeBand] = useState(defaultAgeBand ?? "");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>(defaultSort);

  const isFirstQueryUpdate = useRef(true);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    setStatus(defaultStatus ?? "");
  }, [defaultStatus]);

  useEffect(() => {
    setAgeBand(defaultAgeBand ?? "");
  }, [defaultAgeBand]);

  useEffect(() => {
    setSort(defaultSort);
  }, [defaultSort]);

  const savedViews = useMemo<SavedView[]>(
    () => [
      {
        key: "new",
        label: "New submissions",
        description: "Fresh entries waiting for triage",
        filters: { status: ApplicationStatus.SUBMITTED, sort: "newest", query: "", ageBand: "" },
      },
      {
        key: "in-review",
        label: "In review",
        description: "Actively being vetted by the team",
        filters: { status: ApplicationStatus.IN_REVIEW, sort: "newest", query: "", ageBand: "" },
      },
      {
        key: "accepted",
        label: "Accepted",
        description: "Approved and ready for onboarding",
        filters: { status: ApplicationStatus.APPROVED, sort: "newest", query: "", ageBand: "" },
      },
      {
        key: "rejected",
        label: "Declined",
        description: "Not moving forward",
        filters: { status: ApplicationStatus.REJECTED, sort: "newest", query: "", ageBand: "" },
      },
    ],
    [],
  );

  const applyFilters = useCallback(
    (overrides: Partial<FilterState> = {}) => {
      const nextState: FilterState = {
        query,
        status,
        ageBand,
        sort,
        ...overrides,
      };

      const params = new URLSearchParams();
      const trimmedQuery = nextState.query.trim();
      if (trimmedQuery.length) {
        params.set("q", trimmedQuery);
      }
      if (nextState.status) {
        params.set("status", nextState.status);
      }
      if (nextState.ageBand) {
        params.set("ageBand", nextState.ageBand);
      }
      if (nextState.sort !== "newest") {
        params.set("sort", nextState.sort);
      }

      startTransition(() => {
        const queryString = params.toString();
        router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
      });
    },
    [ageBand, pathname, query, router, sort, startTransition, status],
  );

  const handleSavedView = useCallback(
    (view: SavedView) => {
      const nextQuery = view.filters.query ?? "";
      const nextStatus = view.filters.status ?? "";
      const nextAgeBand = view.filters.ageBand ?? "";
      const nextSort = view.filters.sort ?? "newest";

      setQuery(nextQuery);
      setStatus(nextStatus);
      setAgeBand(nextAgeBand);
      setSort(nextSort);
      applyFilters({
        query: nextQuery,
        status: nextStatus,
        ageBand: nextAgeBand,
        sort: nextSort,
      });
    },
    [applyFilters],
  );

  const isActiveView = useCallback(
    (view: SavedView) => {
      const normalizedQuery = query.trim();
      const viewQuery = (view.filters.query ?? "").trim();
      return (
        (view.filters.status ?? "") === status &&
        (view.filters.ageBand ?? "") === ageBand &&
        (view.filters.sort ?? "newest") === sort &&
        normalizedQuery === viewQuery
      );
    },
    [ageBand, query, sort, status],
  );

  useEffect(() => {
    if (isFirstQueryUpdate.current) {
      isFirstQueryUpdate.current = false;
      return;
    }

    const timer = setTimeout(() => {
      applyFilters({ query });
    }, 400);

    return () => clearTimeout(timer);
  }, [applyFilters, query]);

  return (
    <form className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6 sm:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto] sm:items-start">
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
      </div>
      <div className="space-y-2">
        <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(event) => {
            const nextStatus = event.target.value;
            setStatus(nextStatus);
            applyFilters({ status: nextStatus });
          }}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusLabel(statusOption)}
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
          onChange={(event) => {
            const nextAgeBand = event.target.value;
            setAgeBand(nextAgeBand);
            applyFilters({ ageBand: nextAgeBand });
          }}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
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
          onChange={(event) => {
            const nextSort = event.target.value as (typeof SORT_OPTIONS)[number];
            setSort(nextSort);
            applyFilters({ sort: nextSort });
          }}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A→Z</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="flex flex-col items-start justify-end gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:items-end">
        <span aria-live="polite" className="text-[11px] font-normal normal-case text-muted-foreground">
          {isPending ? "Applying filters…" : "Filters update automatically."}
        </span>
        <Link
          href="/admin/applications"
          className="font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => {
            setQuery("");
            setStatus("");
            setAgeBand("");
            setSort("newest");
          }}
        >
          Reset
        </Link>
      </div>

      <div className="sm:col-span-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Saved views</p>
        <div className="flex flex-wrap gap-3">
          {savedViews.map((view) => {
            const active = isActiveView(view);
            return (
              <Button
                key={view.key}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="justify-start rounded-2xl px-4 text-left"
                onClick={() => handleSavedView(view)}
              >
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold">{view.label}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">{view.description}</span>
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </form>
  );
}
