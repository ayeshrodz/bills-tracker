import { supabase } from "../lib/supabaseClient";

export interface Bill {
  id: string;
  bill_type: string;
  billing_month: number;
  billing_year: number;
  payment_date: string;
  amount: number;
  note?: string;
  inserted_at?: string;
}


export const billsService = {
  async getAll(): Promise<Bill[]> {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(bill: Omit<Bill, "id">) {
    const { error } = await supabase.from("bills").insert(bill);
    if (error) throw error;
  },

  async update(id: string, bill: Partial<Bill>) {
    const { error } = await supabase.from("bills").update(bill).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await supabase.from("bills").delete().eq("id", id);
    if (error) throw error;
  },
};
