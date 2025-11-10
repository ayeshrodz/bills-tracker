import { useCallback, useState } from "react";
import type { BillInsert, BillUpdate, Bill } from "./useBills";
import { billsService } from "../services";
import { normalizeError } from "../utils/errors";
import { SessionExpiredError } from "../lib/errors";
import { useAuth } from "./useAuth";

type MutationState = {
  loading: boolean;
  error: string | null;
};

type UseBillMutationsResult = MutationState & {
  addBill: (bill: BillInsert) => Promise<Bill>;
  updateBill: (id: string, updates: BillUpdate) => Promise<Bill>;
  deleteBill: (id: string) => Promise<void>;
};

export function useBillMutations(): UseBillMutationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleSessionExpired = useCallback(
    (err?: SessionExpiredError) => {
      void signOut();
      return err?.message ?? "Session expired. Please sign in again.";
    },
    [signOut]
  );

  const run = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        return await operation();
      } catch (err) {
        if (err instanceof SessionExpiredError) {
          const message = handleSessionExpired(err);
          setError(message);
          throw new SessionExpiredError(message);
        }
        const message = normalizeError(err);
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [handleSessionExpired]
  );

  const addBill = useCallback(
    (bill: BillInsert) => run(() => billsService.addBill(bill)),
    [run]
  );

  const updateBill = useCallback(
    (id: string, updates: BillUpdate) => run(() => billsService.updateBill(id, updates)),
    [run]
  );

  const deleteBill = useCallback(
    (id: string) => run(() => billsService.deleteBill(id)),
    [run]
  );

  return { addBill, updateBill, deleteBill, loading, error };
}
