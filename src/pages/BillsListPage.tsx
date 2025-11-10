import { Link } from "react-router-dom";
import { useBills } from "../hooks/useBills";
import { BillTable } from "../components/BillTable";

export default function BillsListPage() {
  const { bills, deleteBill, loading, error } = useBills();

  return (
    <div className="pt-20 px-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">All Bills</h2>
        <Link
          to="/add"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          + Add Bill
        </Link>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 p-2 mb-3 rounded">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading bills...</p>
      ) : (
        <BillTable bills={bills} onDelete={deleteBill} />
      )}
    </div>
  );
}
