// src/hooks/useBills.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Bill, BillInsert, BillUpdate } from "../types/bills";

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

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .order("billing_year", { ascending: false })
      .order("billing_month", { ascending: false });

    if (error) {
      console.error("Error fetching bills:", error);
      setError(error.message);
    } else if (data) {
      setBills(data as Bill[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  async function addBill(bill: BillInsert): Promise<void> {
    setError(null);

    const { data, error } = await supabase
      .from("bills")
      .insert([bill])
      .select()
      .single();

    if (error) {
      console.error("Error adding bill:", error);
      setError(error.message);
      return;
    }

    if (data) {
      setBills((prev) => [...prev, data as Bill]);
    }
  }

  async function updateBill(id: string, updated: BillUpdate): Promise<void> {
    setError(null);
    console.log("updateBill: Attempting to update bill with ID:", id, "and data:", updated);

    const { data, error } = await supabase
      .from("bills")
      .update(updated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updateBill: Error updating bill:", error);
      setError(error.message);
      return;
    }

    if (data) {
      console.log("updateBill: Successfully updated bill:", data);
      setBills((prev) =>
        prev.map((b) => (b.id === id ? (data as Bill) : b)),
      );
    }
    console.log("updateBill: Function finished.");
  }

  async function deleteBill(id: string): Promise<void> {
    setError(null);

    const { error } = await supabase
      .from("bills")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting bill:", error);
      setError(error.message);
      return;
    }

    setBills((prev) => prev.filter((b) => b.id !== id));
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
