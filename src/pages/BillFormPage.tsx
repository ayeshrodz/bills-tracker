import { useNavigate, useParams } from "react-router-dom";
import { useBills } from "../hooks/useBills";
import { BillForm } from "../components/BillForm";
import type { Bill } from "../hooks/useBills";

export default function BillFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { bills, addBill, updateBill } = useBills();

  const editingBill = id ? bills.find((b) => b.id === id) || null : null;

  const handleSave = (bill: Omit<Bill, "id">, editingId?: string | null) => {
    if (editingId) updateBill(editingId, bill);
    else addBill(bill);
    navigate("/");
  };

  return (
    <div className="pt-20 px-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        {editingBill ? "Edit Bill" : "Add New Bill"}
      </h2>
      <BillForm
        onSave={handleSave}
        onCancel={() => navigate("/")}
        editingBill={editingBill}
      />
    </div>
  );
}
