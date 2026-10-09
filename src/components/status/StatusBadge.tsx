type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

type StatusBadgeProps = {
  status: string;
  label?: string;
  tone?: StatusTone;
};

const statusTones: Record<string, StatusTone> = {
  ACTIVE: "success",
  SUCCESSFUL: "success",
  AUTHORISED: "success",
  APPROVED: "success",
  COMPLETED: "success",
  PROCESSING: "info",
  AUTHORISATION_IN_PROGRESS: "info",
  VALIDATION_IN_PROGRESS: "info",
  PENDING: "warning",
  PENDING_AUTHORISATION: "warning",
  AWAITING_NEXT_AUTHORISER: "accent",
  RETURNED: "warning",
  DRAFT: "neutral",
  INACTIVE: "neutral",
  CANCELLED: "neutral",
  FAILED: "danger",
  REJECTED: "danger",
  AUTHORISATION_FAILED: "danger",
};

const toneStyles: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  accent:
    "bg-[var(--brand-soft)] text-[var(--brand-primary)] ring-[var(--focus-ring)]",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function StatusBadge({
  status,
  label,
  tone = statusTones[status] ?? "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneStyles[tone]}`}
    >
      {label ?? formatStatus(status)}
    </span>
  );
}

export default StatusBadge;
