import { useNavigate, useParams } from "react-router-dom";
import { useCallback } from "react";
import { useBills } from "../hooks/useBills";
import { BillForm } from "../components/BillForm";
import type { Bill } from "../hooks/useBills";
import { BillAttachmentsPanel } from "../components/BillAttachmentsPanel";
import { useToast } from "../hooks/useToast";

export default function BillFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { bills, addBill, updateBill } = useBills();
  const { toastSuccess, toastError } = useToast();

  const editingBill: Bill | null = id
    ? bills.find((b) => b.id === id) || null
    : null;

  const handleSave = async (
    bill: Omit<Bill, "id">,
    editingId?: string | null
  ) => {
    try {
      if (editingId) {
        await updateBill(editingId, bill);
        toastSuccess("Bill updated");
      } else {
        await addBill(bill);
        toastSuccess("Bill added");
      }
      navigate("/");
    } catch (err) {
      toastError(err);
    }
  };

  const handleCancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="pt-20 px-4 pb-10 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        {editingBill ? "Edit Bill" : "Add New Bill"}
      </h2>

      <BillForm
        onSave={handleSave}
        onCancel={handleCancel}
        editingBill={editingBill}
      />

      {editingBill && (
        <BillAttachmentsPanel billId={editingBill.id} />
      )}
    </div>
  );
}
