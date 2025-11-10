// src/hooks/useBills.ts
import { useEffect, useState, useCallback } from "react";
import type { Bill, BillInsert, BillUpdate } from "../types/bills";
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
  error: string | null;
  refetch: () => Promise<void>;
  addBill: (bill: BillInsert) => Promise<void>;
  updateBill: (id: string, updated: BillUpdate) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
};

export function useBills(): UseBillsResult {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleSessionExpired = useCallback(
    (err?: SessionExpiredError) => {
      void signOut();
      return err?.message ?? "Session expired. Please sign in again.";
    },
    [signOut]
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await billsService.getBills();
      setBills(data);
    } catch (err) {
      logger.error("Error fetching bills", err);
      if (err instanceof SessionExpiredError) {
        setError(handleSessionExpired(err));
      } else {
        setError(normalizeError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  async function addBill(bill: BillInsert): Promise<void> {
    setError(null);

    try {
      const created = await billsService.addBill(bill);
      setBills((prev) => [...prev, created]);
    } catch (err) {
      console.error("Error adding bill:", err);
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
    error,
    refetch,
    addBill,
    updateBill,
    deleteBill,
  };
}
