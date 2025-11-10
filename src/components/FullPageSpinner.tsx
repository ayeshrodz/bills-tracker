export const FullPageSpinner = ({
  label = "Loading…",
}: {
  label?: string;
}) => (
  <div className="flex min-h-[200px] items-center justify-center py-16 text-sm text-slate-500">
    {label}
  </div>
);
