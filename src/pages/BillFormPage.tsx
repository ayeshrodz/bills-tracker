import { useNavigate, useParams } from "react-router-dom";
import { useBills } from "../hooks/useBills";
import { BillForm } from "../components/BillForm";
import type { Bill } from "../hooks/useBills";
import { BillAttachmentsPanel } from "../components/BillAttachmentsPanel";

export default function BillFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { bills, addBill, updateBill } = useBills();

  const editingBill: Bill | null = id
    ? bills.find((b) => b.id === id) || null
    : null;

  const handleSave = async (bill: Omit<Bill, "id">, editingId?: string | null) => {
    if (editingId) {
      await updateBill(editingId, bill);
      navigate("/");
    } else {
      await addBill(bill);
      navigate("/");
    }
  };

  return (
    <div className="pt-20 px-4 pb-10 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        {editingBill ? "Edit Bill" : "Add New Bill"}
      </h2>

      <BillForm
        onSave={handleSave}
        onCancel={() => navigate("/")}
        editingBill={editingBill}
      />

      {editingBill && (
        <BillAttachmentsPanel billId={editingBill.id} />
      )}
    </div>
  );
}
