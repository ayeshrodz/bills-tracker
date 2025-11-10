// src/pages/BillsListPage.tsx
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useBills } from "../hooks/useBills";
import { BillsGrid } from "../components/BillsGrid";
import { useToast } from "../hooks/useToast";
import { useCategories } from "../hooks/useCategories";
import { MONTH_OPTIONS } from "../constants";
import type { BillsFilters } from "../types/bills";

export default function BillsListPage() {
  const FILTERS_PANEL_STATE_KEY = "billsFiltersOpen";
  const {
    bills,
    deleteBill,
    loading,
    loadingMore,
    error,
    filters,
    totalCount,
    totalAmount,
    latestBill,
    summaryLoading,
    hasMore,
    loadMore,
    setFilters,
  } = useBills();
  const { categories } = useCategories();
  const { toastSuccess, toastError } = useToast();
  const [filterDraft, setFilterDraft] = useState<BillsFilters>(filters);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(FILTERS_PANEL_STATE_KEY) === "true";
  });

  useEffect(() => {
    setFilterDraft(filters);
  }, [filters]);

  const totalBills = totalCount ?? bills.length;

  const formattedTotalAmount = totalAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteBill(id);
        toastSuccess("Bill deleted");
      } catch (err) {
        toastError(err);
      }
    },
    [deleteBill, toastSuccess, toastError]
  );

  useEffect(() => {
    if (error) {
      toastError(error);
    }
  }, [error, toastError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FILTERS_PANEL_STATE_KEY, String(filtersOpen));
  }, [filtersOpen]);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    categories.forEach((cat) => names.add(cat.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const cleanFilters = (draft: BillsFilters): BillsFilters => {
    const next: BillsFilters = {};
    if (draft.category) next.category = draft.category;
    if (draft.billingMonth) next.billingMonth = draft.billingMonth;
    if (draft.billingYear) next.billingYear = draft.billingYear;
    if (draft.dateFrom) next.dateFrom = draft.dateFrom;
    if (draft.dateTo) next.dateTo = draft.dateTo;
    if (typeof draft.amountMin === "number") next.amountMin = draft.amountMin;
    if (typeof draft.amountMax === "number") next.amountMax = draft.amountMax;
    return next;
  };

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter(
        (value) => value !== undefined && value !== null && value !== ""
      ).length,
    [filters]
  );

  const handleApplyFilters = () => {
    setFilters(cleanFilters(filterDraft));
  };

  const handleResetFilters = () => {
    setFilterDraft({});
    setFilters({});
  };

  const showingCount = `${bills.length}${
    totalCount ? ` of ${totalCount}` : ""
  }`;

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loadingMore) {
            void loadMore();
          }
        });
      },
      { rootMargin: "200px" }
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, loadingMore]);

  return (
    <div className="pt-20 px-4 pb-10 max-w-5xl mx-auto">
      {/* Header + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Bills overview
          </h2>
          <p className="text-sm text-slate-500">
            Track your recurring bills, payment dates, and notes.
          </p>
        </div>
        <div className="flex justify-start sm:justify-end">
          <Link
            to="/bills/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            + Add Bill
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dashboard summary */}
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-800 text-white p-4 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-300 flex items-center gap-2">
            <span>Total bills</span>
            {summaryLoading && (
              <span className="text-[10px] text-slate-400">Updating…</span>
            )}
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalBills}</p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
            <span>Total amount</span>
            {summaryLoading && (
              <span className="text-[10px] text-slate-400">Updating…</span>
            )}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ${formattedTotalAmount}
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Last payment
          </p>
          {latestBill ? (
            <div className="mt-2">
              <p className="text-sm font-semibold text-slate-900">
                {latestBill.bill_type}
              </p>
              <p className="text-xs text-slate-500">
                {latestBill.payment_date} • $
                {latestBill.amount.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No payments yet.</p>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setFiltersOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800"
          aria-expanded={filtersOpen}
        >
          <div className="flex items-center gap-2">
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {filtersOpen ? "Hide" : "Show"}
          </span>
        </button>

        <div
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${filtersOpen ? "max-h-[1200px]" : "max-h-0"}`}
          aria-hidden={!filtersOpen}
        >
          <div className="border-t border-slate-100 px-4 py-4">
            <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium text-slate-600">
              Category
            </span>
            <select
              value={filterDraft.category ?? ""}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  category: e.target.value || undefined,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium text-slate-600">
              Billing Month
            </span>
            <select
              value={filterDraft.billingMonth ?? ""}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  billingMonth: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {MONTH_OPTIONS.map((monthName, index) => (
                <option key={monthName} value={index + 1}>
                  {monthName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium text-slate-600">
              Billing Year
            </span>
            <input
              type="number"
              value={filterDraft.billingYear ?? ""}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  billingYear: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. 2024"
            />
          </label>

          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium text-slate-600">
              Payment Date (from)
            </span>
            <input
              type="date"
              value={filterDraft.dateFrom ?? ""}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  dateFrom: e.target.value || undefined,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium text-slate-600">
              Payment Date (to)
            </span>
            <input
              type="date"
              value={filterDraft.dateTo ?? ""}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  dateTo: e.target.value || undefined,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col text-xs">
              <span className="mb-1 font-medium text-slate-600">
                Min amount
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={filterDraft.amountMin ?? ""}
                onChange={(e) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    amountMin: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col text-xs">
              <span className="mb-1 font-medium text-slate-600">
                Max amount
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={filterDraft.amountMax ?? ""}
                onChange={(e) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    amountMax: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
          </div>
        </div>
      </section>

      {/* Content */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading bills…</p>
      ) : (
        <>
          <BillsGrid bills={bills} onDelete={handleDelete} />
          <div className="mt-6 flex flex-col items-center gap-2 text-xs text-slate-500">
            <span>Showing {showingCount} bills</span>
            {hasMore && (
              <button
                type="button"
                onClick={() => void loadMore()}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
            <div ref={loadMoreRef} className="h-1 w-full" />
          </div>
        </>
      )}
    </div>
  );
}
