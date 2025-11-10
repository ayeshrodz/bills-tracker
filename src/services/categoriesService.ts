// src/services/categoriesService.ts
import { supabase } from "../lib/supabaseClient";
import { requireSession } from "../lib/withSessionCheck";

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
  const session = await requireSession();
  const user = session.user;

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
  await requireSession();
  // First, get the category name to check for associated bills
  const { data: categoryData, error: categoryError } = await supabase
    .from("bill_categories")
    .select("name")
    .eq("id", id)
    .single();

  if (categoryError) throw categoryError;
  if (!categoryData) throw new Error("Category not found.");

  const categoryName = categoryData.name;

  // Check if any bills are using this category
  const { count, error: billsError } = await supabase
    .from("bills")
    .select("id", { count: "exact" })
    .eq("bill_type", categoryName);

  if (billsError) throw billsError;

  if (count && count > 0) {
    throw new Error(
      `Cannot delete category "${categoryName}" because ${count} bill(s) are associated with it.`
    );
  }

  // If no bills are associated, proceed with deletion
  const { error } = await supabase
    .from("bill_categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
