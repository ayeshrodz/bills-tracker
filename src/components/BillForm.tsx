import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { Bill } from "../hooks/useBills";

// Bill type options
const billOptions = [
  "Daycare",
  "Electricity",
  "House Rent",
  "Mobile",
  "Internet",
  "Car Insurance",
];

// Dynamically generate month names (localized)
const monthOptions = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString("default", { month: "long" })
);

type Props = {
  onSave: (bill: Omit<Bill, "id">, editingId?: string | null) => void;
  onCancel: () => void;
  editingBill: Bill | null;
};

export const BillForm = ({ onSave, onCancel, editingBill }: Props) => {
  const [billType, setBillType] = useState(billOptions[0]);
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1); // 1–12
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
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      {/* Bill Type & Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium text-slate-700">Bill Type</span>
          <select
            value={billType}
            onChange={(e) => setBillType(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {billOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium text-slate-700">Amount</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            step="0.01"
            min={0}
            required
          />
        </label>
      </div>

      {/* Month, Year, and Payment Date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium text-slate-700">Billing Month</span>
          <select
            value={billingMonth}
            onChange={(e) => setBillingMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {monthOptions.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium text-slate-700">Billing Year</span>
          <input
            type="number"
            value={billingYear}
            onChange={(e) => setBillingYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium text-slate-700">Payment Date</span>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {/* Note */}
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-medium text-slate-700">
          Note <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <textarea
          placeholder="Any extra details about this bill…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
        />
      </label>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 w-full sm:w-auto"
        >
          {editingBill ? "Save Changes" : "Add Bill"}
        </button>
        {editingBill && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-100 w-full sm:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
