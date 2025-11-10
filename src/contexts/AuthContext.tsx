import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

// We start as undefined so useAuth can throw a clear error
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
