import { useEffect, useState } from "react";
import type { Bill } from "./useBills";
import { billsService } from "../services";
import { normalizeError } from "../utils/errors";

type UseBillDetailResult = {
  bill: Bill | null;
  loading: boolean;
  error: string | null;
};

export function useBillDetail(id: string | null): UseBillDetailResult {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setBill(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    billsService
      .getBillById(id)
      .then((data) => {
        if (!cancelled) {
          setBill(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(normalizeError(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { bill, loading, error };
}
