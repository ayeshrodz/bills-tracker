// src/constants.ts

// Dynamically generate month names (localized)
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString("default", { month: "long" })
);
