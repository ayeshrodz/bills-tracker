import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Bill = {
  id: string;
  bill_type: string;
  billing_month: number;
  billing_year: number;
  payment_date: string;
  amount: number;
  note?: string;
  inserted_at?: string;
};

type BillInsert = Omit<Bill, "id" | "inserted_at">;
type BillUpdate = Partial<Omit<Bill, "inserted_at">>;

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, []);

  async function refetch() {
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
  }

  async function addBill(bill: BillInsert) {
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

  async function updateBill(id: string, updated: BillUpdate) {
    setError(null);

    const { data, error } = await supabase
      .from("bills")
      .update(updated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating bill:", error);
      setError(error.message);
      return;
    }

    if (data) {
      setBills((prev) =>
        prev.map((b) => (b.id === id ? (data as Bill) : b))
      );
    }
  }

  async function deleteBill(id: string) {
    setError(null);

    const { error } = await supabase.from("bills").delete().eq("id", id);

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
    addBill,
    updateBill,
    deleteBill,
    refetch,
  };
}
