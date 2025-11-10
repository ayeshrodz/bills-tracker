export interface Bill {
  id: string;
  bill_type: string;
  billing_month: number;
  billing_year: number;
  payment_date: string; // ISO date string from Supabase
  amount: number;
  note?: string;
  inserted_at?: string;
}

// Payload when creating a new bill from the UI
export type BillInsert = Omit<Bill, "id" | "inserted_at">;

// Payload when updating an existing bill
export type BillUpdate = Partial<BillInsert>;

export type BillsFilters = {
  category?: string;
  billingMonth?: number;
  billingYear?: number;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
};

export type BillsQuery = BillsFilters & {
  limit?: number;
  offset?: number;
  withCount?: boolean;
};
