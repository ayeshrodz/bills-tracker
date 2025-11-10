import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { SessionExpiredError } from "./errors";

export const requireSession = async (): Promise<Session> => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new SessionExpiredError();
  }

  return data.session;
};
