// src/hooks/useBills.ts
import { useEffect, useState, useCallback } from "react";
import type {
  Bill,
  BillInsert,
  BillUpdate,
  BillsFilters,
} from "../types/bills";
import { billsService } from "../services";
import { normalizeError } from "../utils/errors";
import { SessionExpiredError } from "../lib/errors";
import { useAuth } from "./useAuth";
import { logger } from "../utils/logger";
import { supabase } from "../lib/supabaseClient";

// Re-export types so existing imports like `import { Bill } from "../hooks/useBills"` keep working
export type { Bill, BillInsert, BillUpdate } from "../types/bills";

type UseBillsResult = {
  bills: Bill[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  filters: BillsFilters;
  totalCount: number | null;
  totalAmount: number;
  latestBill: Bill | null;
  summaryLoading: boolean;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (next: BillsFilters) => void;
  addBill: (bill: BillInsert) => Promise<void>;
  updateBill: (id: string, updated: BillUpdate) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
};

const PAGE_SIZE = 25;

export function useBills(): UseBillsResult {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<BillsFilters>({});
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { user, signOut } = useAuth();

  const handleSessionExpired = useCallback(
    (err?: SessionExpiredError) => {
      void signOut();
      return err?.message ?? "Session expired. Please sign in again.";
    },
    [signOut]
  );

  const fetchBills = useCallback(
    async ({
      nextOffset = 0,
      append = false,
      forceCount = false,
    }: {
      nextOffset?: number;
      append?: boolean;
      forceCount?: boolean;
    } = {}) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const shouldIncludeCount = forceCount || (!append && nextOffset === 0);
        const { data, count } = await billsService.getBills({
          ...filters,
          limit: PAGE_SIZE,
          offset: nextOffset,
          withCount: shouldIncludeCount,
        });
        if (shouldIncludeCount) {
          setTotalCount(count ?? null);
        }
        const effectiveTotal = shouldIncludeCount
          ? count ?? null
          : totalCount;
        setHasMore(
          effectiveTotal != null
            ? nextOffset + data.length < effectiveTotal
            : data.length === PAGE_SIZE
        );
        setOffset(nextOffset);
        setBills((prev) => (append ? [...prev, ...data] : data));
      } catch (err) {
        logger.error("Error fetching bills", err);
        if (err instanceof SessionExpiredError) {
          setError(handleSessionExpired(err));
        } else {
          setError(normalizeError(err));
        }
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [filters, handleSessionExpired, totalCount]
  );

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const summary = await billsService.getBillsSummary(filters);
      setTotalCount(summary.totalCount);
      setTotalAmount(summary.totalAmount);
      setLatestBill(summary.latestBill);
    } catch (err) {
      logger.error("Error fetching bills summary", err);
      if (err instanceof SessionExpiredError) {
        setError(handleSessionExpired(err));
      } else {
        setError(normalizeError(err));
      }
    } finally {
      setSummaryLoading(false);
    }
  }, [filters, handleSessionExpired]);

  const refetch = useCallback(async () => {
    await Promise.all([
      fetchBills({ nextOffset: 0, append: false, forceCount: true }),
      fetchSummary(),
    ]);
  }, [fetchBills, fetchSummary]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await fetchBills({ nextOffset: offset + PAGE_SIZE, append: true });
  }, [fetchBills, hasMore, loadingMore, offset]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`public:bills:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bills",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void refetch();
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [user, refetch]);

  const setFilters = useCallback((next: BillsFilters) => {
    setFiltersState(next);
  }, []);

  async function addBill(bill: BillInsert): Promise<void> {
    setError(null);

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Bill = {
      ...bill,
      id: tempId,
    };
    setBills((prev) => [optimistic, ...prev]);

    try {
      const created = await billsService.addBill(bill);
      setBills((prev) =>
        prev.map((b) => (b.id === tempId ? created : b))
      );
      await fetchSummary();
    } catch (err) {
      logger.error("Error adding bill", err);
      setBills((prev) => prev.filter((b) => b.id !== tempId));
      if (err instanceof SessionExpiredError) {
        const message = handleSessionExpired(err);
        throw new SessionExpiredError(message);
      }
      const message = normalizeError(err);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  async function updateBill(id: string, updated: BillUpdate): Promise<void> {
    setError(null);
    const prevBills = bills;
    setBills((current) =>
      current.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );

    try {
      const updatedBill = await billsService.updateBill(id, updated);
      setBills((current) =>
        current.map((b) => (b.id === id ? updatedBill : b))
      );
      await fetchSummary();
    } catch (err) {
      logger.error("Error updating bill", err);
      setBills(prevBills);
      if (err instanceof SessionExpiredError) {
        const message = handleSessionExpired(err);
        throw new SessionExpiredError(message);
      }
      const message = normalizeError(err);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  async function deleteBill(id: string): Promise<void> {
    setError(null);

    const previous = bills;
    setBills((prev) => prev.filter((b) => b.id !== id));

    try {
      await billsService.deleteBill(id);
      await fetchSummary();
    } catch (err) {
      logger.error("Error deleting bill", err);
      setBills(previous);
      if (err instanceof SessionExpiredError) {
        const message = handleSessionExpired(err);
        throw new SessionExpiredError(message);
      }
      const message = normalizeError(err);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  return {
    bills,
    loading,
    loadingMore,
    error,
    filters,
    totalCount,
    totalAmount,
    latestBill,
    summaryLoading,
    hasMore,
    refetch,
    loadMore,
    setFilters,
    addBill,
    updateBill,
    deleteBill,
  };
}
