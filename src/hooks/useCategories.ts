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
    } catch (err: any) {
      setError(err.message);
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
      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoriesService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { categories, loading, error, addCategory, deleteCategory, refetch: fetchCategories };
};
