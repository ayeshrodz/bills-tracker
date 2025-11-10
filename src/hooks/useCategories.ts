// src/hooks/useCategories.ts
import { useState, useEffect, useCallback } from "react";
import * as categoriesService from "../services/categoriesService";
import type { BillCategory } from "../services/categoriesService";
import { SessionExpiredError } from "../lib/errors";
import { useAuth } from "./useAuth";

export const useCategories = () => {
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleSessionExpired = useCallback(
    (err?: SessionExpiredError) => {
      void signOut();
      return err?.message ?? "Session expired. Please sign in again.";
    },
    [signOut]
  );

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        setError(handleSessionExpired(err));
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const clearError = useCallback(() => setError(null), []);

  const addCategory = async (name: string) => {
    try {
      const newCategory = await categoriesService.addCategory(name);
      setCategories((prev) =>
        [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
      );
      return newCategory;
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        const message = handleSessionExpired(err);
        throw new SessionExpiredError(message);
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoriesService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        const message = handleSessionExpired(err);
        throw new SessionExpiredError(message);
      }
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    deleteCategory,
    clearError,
    refetch: fetchCategories,
  };
};
