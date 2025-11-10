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

// Re-export types so existing imports like `import { Bill } from "../hooks/useBills"` keep working
export type { Bill, BillInsert, BillUpdate } from "../types/bills";

type UseBillsResult = {
  bills: Bill[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  filters: BillsFilters;
  totalCount: number | null;
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
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { signOut } = useAuth();

  const handleSessionExpired = useCallback(
    (err?: SessionExpiredError) => {
      void signOut();
      return err?.message ?? "Session expired. Please sign in again.";
    },
    [signOut]
  );

  const fetchBills = useCallback(
    async ({ nextOffset = 0, append = false } = {}) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const { data, count } = await billsService.getBills({
          ...filters,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setTotalCount(count ?? null);
        setHasMore(
          count != null
            ? nextOffset + data.length < count
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
    [filters, handleSessionExpired]
  );

  const refetch = useCallback(
    async () => fetchBills({ nextOffset: 0, append: false }),
    [fetchBills]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await fetchBills({ nextOffset: offset + PAGE_SIZE, append: true });
  }, [fetchBills, hasMore, loadingMore, offset]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const setFilters = useCallback((next: BillsFilters) => {
    setFiltersState(next);
  }, []);

  async function addBill(bill: BillInsert): Promise<void> {
    setError(null);

    try {
      const created = await billsService.addBill(bill);
      setBills((prev) => [...prev, created]);
    } catch (err) {
      logger.error("Error adding bill", err);
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
    try {
      const updatedBill = await billsService.updateBill(id, updated);
      setBills((prev) => prev.map((b) => (b.id === id ? updatedBill : b)));
    } catch (err) {
      logger.error("Error updating bill", err);
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

    try {
      await billsService.deleteBill(id);
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      logger.error("Error deleting bill", err);
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
    hasMore,
    refetch,
    loadMore,
    setFilters,
    addBill,
    updateBill,
    deleteBill,
  };
}
