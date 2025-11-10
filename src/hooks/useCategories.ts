// src/hooks/useCategories.ts
import { useState, useEffect, useCallback } from "react";
import * as categoriesService from "../services/categoriesService";
import type { BillCategory } from "../services/categoriesService";

export const useCategories = () => {
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string) => {
    try {
      const newCategory = await categoriesService.addCategory(name);
      setCategories((prev) =>
        [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
      );
      return newCategory;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoriesService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  return { categories, loading, error, addCategory, deleteCategory, refetch: fetchCategories };
};
