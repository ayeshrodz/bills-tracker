import { supabase } from "../lib/supabaseClient";
import { requireSession } from "../lib/withSessionCheck";
import type { Bill, BillInsert, BillUpdate } from "../types/bills";

export const getBills = async (): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("billing_year", { ascending: false })
    .order("billing_month", { ascending: false });

  if (error) throw error;
  return data as Bill[];
};

export const addBill = async (bill: BillInsert): Promise<Bill> => {
  await requireSession();

  const { data, error } = await supabase
    .from("bills")
    .insert([bill])
    .select()
    .single();

  if (error) throw error;
  return data as Bill;
};

export const updateBill = async (
  id: string,
  updates: BillUpdate
): Promise<Bill> => {
  await requireSession();

  const { data, error } = await supabase
    .from("bills")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Bill;
};

export const deleteBill = async (id: string): Promise<void> => {
  await requireSession();

  const { error } = await supabase.from("bills").delete().eq("id", id);

  if (error) throw error;
};
