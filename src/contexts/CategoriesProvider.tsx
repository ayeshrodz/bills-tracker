import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type BillCategory,
  addCategory as addCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  getCategories,
} from "../services/categoriesService";
import { CategoriesContext } from "./CategoriesContext";
import { SessionExpiredError } from "../lib/errors";
import { useAuth } from "../hooks/useAuth";

type Props = { children: ReactNode };

export function CategoriesProvider({ children }: Props) {
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
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
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

  const addCategory = useCallback(
    async (name: string) => {
      try {
        const newCategory = await addCategoryRequest(name);
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
    },
    [handleSessionExpired]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        await deleteCategoryRequest(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        if (err instanceof SessionExpiredError) {
          const message = handleSessionExpired(err);
          throw new SessionExpiredError(message);
        }
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    [handleSessionExpired]
  );

  const value = useMemo(
    () => ({
      categories,
      loading,
      error,
      addCategory,
      deleteCategory,
      clearError: () => setError(null),
      refetch: fetchCategories,
    }),
    [categories, loading, error, addCategory, deleteCategory, fetchCategories]
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}
