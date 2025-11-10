import { createContext } from "react";
import type { BillCategory } from "../services/categoriesService";

export type CategoriesContextValue = {
  categories: BillCategory[];
  loading: boolean;
  error: string | null;
  addCategory: (name: string) => Promise<BillCategory>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
};

export const CategoriesContext = createContext<CategoriesContextValue | undefined>(
  undefined
);
