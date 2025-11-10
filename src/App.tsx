import { useState } from "react";
import { useBills } from "./hooks/useBills";
import type { Bill } from "./hooks/useBills";
import { BillForm } from "./components/BillForm";
import { BillTable } from "./components/BillTable";

export default function App() {
  const { bills, addBill, updateBill, deleteBill, loading, error } = useBills();
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const handleSave = (bill: Omit<Bill, "id">, id?: string | null) => {
    if (id) updateBill(id, bill);
    else addBill(bill);
    setEditingBill(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-10">
      <div className="w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Bills Tracker (Supabase)
        </h1>
        <p className="text-xs text-slate-500 mb-4">
          Data is now stored in the Supabase <code>bills</code> table.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <BillForm
          onSave={handleSave}
          onCancel={() => setEditingBill(null)}
          editingBill={editingBill}
        />

        {loading ? (
          <p className="text-slate-500 text-sm mt-4">
            Loading bills from Supabase…
          </p>
        ) : (
          <BillTable
            bills={bills}
            onEdit={setEditingBill}
            onDelete={deleteBill}
          />
        )}
      </div>
    </div>
  );
}
