import { LoaderCircle } from "lucide-react";

type LoadingSpinnerProps = {
  label?: string;
  compact?: boolean;
};

function LoadingSpinner({
  label = "Loading",
  compact = false,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center text-[var(--text-secondary)] ${
        compact ? "gap-2" : "min-h-64 flex-col gap-4"
      }`}
    >
      <LoaderCircle
        aria-hidden="true"
        className="animate-spin text-[var(--brand-primary)]"
        size={compact ? 18 : 26}
      />
      <span className={compact ? "text-sm font-medium" : "text-sm font-semibold"}>
        {label}
      </span>
    </div>
  );
}

export default LoadingSpinner;
