import { supabase } from "../lib/supabaseClient";
import { requireSession } from "../lib/withSessionCheck";
import type {
  Bill,
  BillInsert,
  BillUpdate,
  BillsQuery,
} from "../types/bills";

const buildQuery = (query: BillsQuery = {}) => {
  let request = supabase
    .from("bills")
    .select("*", { count: "exact" })
    .order("payment_date", { ascending: false })
    .order("billing_year", { ascending: false })
    .order("billing_month", { ascending: false });

  if (query.category) {
    request = request.eq("bill_type", query.category);
  }

  if (query.billingMonth) {
    request = request.eq("billing_month", query.billingMonth);
  }

  if (query.billingYear) {
    request = request.eq("billing_year", query.billingYear);
  }

  if (query.dateFrom) {
    request = request.gte("payment_date", query.dateFrom);
  }

  if (query.dateTo) {
    request = request.lte("payment_date", query.dateTo);
  }

  if (typeof query.amountMin === "number") {
    request = request.gte("amount", query.amountMin);
  }

  if (typeof query.amountMax === "number") {
    request = request.lte("amount", query.amountMax);
  }

  if (typeof query.limit === "number") {
    const offset = query.offset ?? 0;
    request = request.range(offset, offset + query.limit - 1);
  }

  return request;
};

export const getBills = async (
  query: BillsQuery = {}
): Promise<{ data: Bill[]; count: number | null }> => {
  const request = buildQuery(query);

  const { data, error, count } = await request;
  if (error) throw error;
  return { data: (data as Bill[]) ?? [], count: count ?? null };
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
