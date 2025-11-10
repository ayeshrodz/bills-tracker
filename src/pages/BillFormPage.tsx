import { lazy, Suspense, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BillForm } from "../components/BillForm";
import { useToast } from "../hooks/useToast";
import { useBillDetail } from "../hooks/useBillDetail";
import { useBillMutations } from "../hooks/useBillMutations";
import { FullPageSpinner } from "../components/FullPageSpinner";
import type { Bill } from "../hooks/useBills";

const BillAttachmentsPanel = lazy(() =>
  import("../components/BillAttachmentsPanel").then((module) => ({
    default: module.BillAttachmentsPanel,
  }))
);

export default function BillFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const billId = id ?? null;
  const { toastSuccess, toastError } = useToast();
  const {
    bill: editingBill,
    loading: billLoading,
    error: billError,
  } = useBillDetail(billId);
  const { addBill, updateBill, error: mutationError } = useBillMutations();

  useEffect(() => {
    if (billError) {
      toastError(billError);
    }
  }, [billError, toastError]);

  useEffect(() => {
    if (mutationError) {
      toastError(mutationError);
    }
  }, [mutationError, toastError]);

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

  if (billId && billLoading && !editingBill) {
    return <FullPageSpinner label="Loading bill…" />;
  }

  if (billId && !editingBill && billError) {
    return (
      <div className="pt-20 px-4 pb-10 max-w-2xl mx-auto text-sm text-red-600">
        Unable to load the requested bill. Please try again later.
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 pb-10 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        {billId ? "Edit Bill" : "Add New Bill"}
      </h2>

      <BillForm
        onSave={handleSave}
        onCancel={handleCancel}
        editingBill={editingBill}
      />

      {editingBill && (
        <Suspense fallback={<FullPageSpinner label="Loading attachments…" />}>
          <BillAttachmentsPanel billId={editingBill.id} />
        </Suspense>
      )}
    </div>
  );
}
