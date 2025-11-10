// src/services/categoriesService.ts
import { supabase } from "../lib/supabaseClient";

export interface BillCategory {
  id: string;
  name: string;
  user_id: string | null; // null for default categories
}

// Fetches all categories (default + user-specific)
export const getCategories = async (): Promise<BillCategory[]> => {
  const { data, error } = await supabase
    .from("bill_categories")
    .select("id, name, user_id")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
};

// Adds a new category for the current user
export const addCategory = async (name: string): Promise<BillCategory> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("bill_categories")
    .insert({ name, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Deletes a user's category
export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("bill_categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
