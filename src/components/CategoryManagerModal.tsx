// src/components/CategoryManagerModal.tsx
import { useState, useMemo, useEffect } from "react";
import { useCategories } from "../hooks/useCategories";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import ConfirmDialog from "./ConfirmDialog";
import type { BillCategory } from "../services/categoriesService";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
}: CategoryManagerModalProps) {
  const { user } = useAuth();
  const { categories, loading, error, addCategory, deleteCategory } =
    useCategories();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BillCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toastSuccess, toastError } = useToast();

  const userCategories = useMemo(
    () => categories.filter((c) => c.user_id === user?.id),
    [categories, user]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      await addCategory(trimmed);
      toastSuccess("Category added");
      setNewCategoryName("");
    } catch (err) {
      toastError(err);
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    if (error) {
      toastError(error);
    }
  }, [error, toastError]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      toastSuccess(`Deleted "${pendingDelete.name}"`);
    } catch (err) {
      toastError(err);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      // Backdrop
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
    >
      <div
        // Modal content
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-800">
          Manage Categories
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add or remove your custom bill categories.
        </p>

        {/* Add Category Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 pb-5">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name..."
            className="flex-grow rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={!newCategoryName.trim() || adding}
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-2 h-48 overflow-y-auto border-t border-slate-200 pt-4">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading categories…</p>
          ) : userCategories.length === 0 ? (
            <p className="text-slate-500 text-sm text-center pt-4">
              You haven't added any custom categories yet.
            </p>
          ) : (
            userCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="text-sm text-slate-800">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => setPendingDelete(cat)}
                  className="shrink-0 rounded-md bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete category?"
        description={
          pendingDelete ? (
            <>
              <span className="font-semibold">{pendingDelete.name}</span> will
              be removed for your account.
            </>
          ) : null
        }
        confirmLabel="Delete"
        destructive
        confirmLoading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
