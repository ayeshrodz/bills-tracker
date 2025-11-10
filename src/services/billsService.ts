import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { requireSession } from "../lib/withSessionCheck";
import type {
  Bill,
  BillInsert,
  BillUpdate,
  BillsQuery,
  BillsFilters,
} from "../types/bills";
import { logger } from "../utils/logger";

const createBillsQuery = () => supabase.from("bills");
type BillsQueryBuilder = ReturnType<typeof createBillsQuery>;

const applyFilters = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: BillsQueryBuilder | any,
  filters: BillsFilters = {}
) => {
  let q = request;

  if (filters.category) {
    q = q.eq("bill_type", filters.category);
  }

  if (filters.billingMonth) {
    q = q.eq("billing_month", filters.billingMonth);
  }

  if (filters.billingYear) {
    q = q.eq("billing_year", filters.billingYear);
  }

  if (filters.dateFrom) {
    q = q.gte("payment_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    q = q.lte("payment_date", filters.dateTo);
  }

  if (typeof filters.amountMin === "number") {
    q = q.gte("amount", filters.amountMin);
  }

  if (typeof filters.amountMax === "number") {
    q = q.lte("amount", filters.amountMax);
  }

  return q;
};

export const getBills = async (
  query: BillsQuery = {}
): Promise<{ data: Bill[]; count: number | null }> => {
  const withCount = query.withCount ?? true;
  let request = withCount
    ? createBillsQuery().select("*", { count: "exact" })
    : createBillsQuery().select("*");

  request = request
    .order("payment_date", { ascending: false })
    .order("billing_year", { ascending: false })
    .order("billing_month", { ascending: false });

  request = applyFilters(request, query);

  if (typeof query.limit === "number") {
    const offset = query.offset ?? 0;
    request = request.range(offset, offset + query.limit - 1);
  }

  const { data, error, count } = await request;
  if (error) throw error;
  return {
    data: (data as Bill[]) ?? [],
    count: withCount ? count ?? null : null,
  };
};

type BillsSummaryRow = {
  total_count: number | null;
  total_amount: number | null;
  latest_bill: Bill | null;
};

export const getBillsSummary = async (
  filters: BillsFilters = {}
): Promise<{
  totalCount: number;
  totalAmount: number;
  latestBill: Bill | null;
}> => {
  try {
    const { data, error } = await supabase.rpc("get_bills_summary", {
      filters,
    });

    if (error) {
      throw error;
    }

    const row: BillsSummaryRow | undefined = Array.isArray(data)
      ? (data[0] as BillsSummaryRow)
      : (data as BillsSummaryRow | undefined);

    if (!row) {
      throw new Error("RPC returned no summary data");
    }

    return {
      totalCount: Number(row.total_count ?? 0),
      totalAmount: Number(row.total_amount ?? 0),
      latestBill: (row.latest_bill as Bill | null) ?? null,
    };
  } catch (err) {
    logger.warn("RPC get_bills_summary failed, using fallback", err);
    return fetchSummaryFallback(filters);
  }
};

const fetchSummaryFallback = async (
  filters: BillsFilters
): Promise<{
  totalCount: number;
  totalAmount: number;
  latestBill: Bill | null;
}> => {
  const countQuery = applyFilters(
    createBillsQuery().select("*", { count: "exact", head: true }),
    filters
  );
  const { count, error: countError } = await countQuery;
  if (countError) throw countError;

  let totalAmount = 0;
  try {
    const sumQuery = applyFilters(
      createBillsQuery().select("sum:amount.sum()").single(),
      filters
    );
    const { data: sumData, error: sumError } = await sumQuery;
    if (sumError) throw sumError;
    totalAmount = Number(sumData?.sum ?? 0);
  } catch (err) {
    const pgErr = err as PostgrestError;
    if (pgErr?.code === "PGRST123") {
      const fallbackQuery = applyFilters(
        createBillsQuery().select("amount"),
        filters
      );
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw fallbackError;
      totalAmount =
        fallbackData?.reduce(
          (acc: number, row: { amount: number }) => acc + Number(row.amount ?? 0),
          0
        ) ?? 0;
    } else {
      throw err;
    }
  }

  const latestQuery = applyFilters(
    createBillsQuery()
      .select("*")
      .order("payment_date", { ascending: false })
      .order("billing_year", { ascending: false })
      .order("billing_month", { ascending: false })
      .limit(1),
    filters
  );
  const { data: latestData, error: latestError } = await latestQuery;
  if (latestError) throw latestError;

  return {
    totalCount: count ?? 0,
    totalAmount,
    latestBill: latestData?.[0] ? (latestData[0] as Bill) : null,
  };
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

export const getBillById = async (id: string): Promise<Bill | null> => {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Bill;
};
