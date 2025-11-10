// src/hooks/useBills.ts
import { useEffect, useState, useCallback } from "react";
import type { Bill, BillInsert, BillUpdate } from "../types/bills";
import { billsService } from "../services";
import { normalizeError } from "../utils/errors";

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

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await billsService.getBills();
      setBills(data);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  async function addBill(bill: BillInsert): Promise<void> {
    setError(null);

    try {
      const created = await billsService.addBill(bill);
      setBills((prev) => [...prev, created]);
    } catch (err) {
      const message = normalizeError(err);
      console.error("Error adding bill:", err);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  async function updateBill(id: string, updated: BillUpdate): Promise<void> {
    setError(null);
    console.log("updateBill: Attempting to update bill with ID:", id, "and data:", updated);

    try {
      const updatedBill = await billsService.updateBill(id, updated);
      setBills((prev) => prev.map((b) => (b.id === id ? updatedBill : b)));
    } catch (err) {
      const message = normalizeError(err);
      console.error("updateBill: Error updating bill:", err);
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
      const message = normalizeError(err);
      console.error("Error deleting bill:", err);
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
