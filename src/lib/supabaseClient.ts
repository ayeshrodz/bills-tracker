import { createClient } from "@supabase/supabase-js";
import { appConfig } from "../config";

export const supabase = createClient(
  appConfig.supabase.url,
  appConfig.supabase.anonKey
);
