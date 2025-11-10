import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Bill } from "../hooks/useBills";

const billOptions = [
  "Daycare",
  "Electricity",
  "House Rent",
  "Mobile",
  "Internet",
  "Car Insurance",
];

type Props = {
  onSave: (bill: Omit<Bill, "id">, editingId?: string | null) => void;
  onCancel: () => void;
  editingBill: Bill | null;
};

export const BillForm = ({ onSave, onCancel, editingBill }: Props) => {
  const [billType, setBillType] = useState(billOptions[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(new Date().getFullYear());
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const now = new Date();
    if (editingBill) {
      setBillType(editingBill.bill_type);
      setBillingMonth(editingBill.billing_month);
      setBillingYear(editingBill.billing_year);
      setPaymentDate(editingBill.payment_date);
      setAmount(editingBill.amount.toString());
      setNote(editingBill.note || "");
    } else {
      setBillType(billOptions[0]);
      setBillingMonth(now.getMonth() + 1);
      setBillingYear(now.getFullYear());
      setPaymentDate(now.toISOString().split("T")[0]);
      setAmount("");
      setNote("");
    }
  }, [editingBill]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(
      {
        bill_type: billType,
        billing_month: billingMonth,
        billing_year: billingYear,
        payment_date: paymentDate,
        amount: parseFloat(amount),
        note,
      },
      editingBill?.id
    );
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 mb-6">
      <div className="grid grid-cols-2 gap-3">
        <select
          value={billType}
          onChange={(e) => setBillType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {billOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          step="0.01"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          type="number"
          placeholder="Month"
          min={1}
          max={12}
          value={billingMonth}
          onChange={(e) => setBillingMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          placeholder="Year"
          value={billingYear}
          onChange={(e) => setBillingYear(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <textarea
        placeholder="Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2"
      />

      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          {editingBill ? "Save" : "Add Bill"}
        </button>
        {editingBill && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
