import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type AttentionBannerProps = {
  count: number;
  label: string;
  to: string;
};

function AttentionBanner({ count, label, to }: AttentionBannerProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Link
      to={to}
      className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-soft)] px-6 py-4 transition hover:border-[var(--brand-primary)]"
    >
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {count} {label}
      </p>

      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
        Review now
        <ArrowRight size={16} />
      </span>
    </Link>
  );
}

export default AttentionBanner;
