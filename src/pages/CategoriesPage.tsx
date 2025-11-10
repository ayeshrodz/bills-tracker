// src/pages/CategoriesPage.tsx
import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { useAuth } from "../hooks/useAuth";

export default function CategoriesPage() {
  const { user } = useAuth();
  const { categories, loading, error, addCategory, deleteCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      void addCategory(newCategoryName.trim());
      setNewCategoryName("");
    }
  };

  return (
    <div className="pt-20 px-4 pb-10 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        Manage Bill Categories
      </h2>

      {/* Add Category Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name..."
          className="flex-grow rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Add
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading categories…</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <span className="text-sm text-slate-800">{cat.name}</span>
              {cat.user_id === user?.id ? (
                <button
                  type="button"
                  onClick={() => void deleteCategory(cat.id)}
                  className="shrink-0 rounded-md bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700"
                >
                  Delete
                </button>
              ) : (
                <span className="text-xs text-slate-400">Default</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
