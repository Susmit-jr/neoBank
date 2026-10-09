import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatDateTime } from "../../utils/dates";

export type Metric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  style: string;
};

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <article
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.style}`}
            >
              <Icon size={21} />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              {metric.label}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              {metric.value}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {metric.detail}
            </p>
          </article>
        );
      })}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function EmptyRow({ message }: { message: string }) {
  return (
    <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
      {message}
    </p>
  );
}

const statusStyles: Record<string, string> = {
  SUCCESSFUL: "bg-emerald-50 text-emerald-700",
  AUTHORISED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  FAILED: "bg-red-50 text-red-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
  APPROVED: "bg-emerald-50 text-emerald-700",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold ${
        statusStyles[status] ?? "bg-amber-50 text-amber-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function TimeText({ value }: { value: string }) {
  return (
    <span className="text-xs text-slate-500">
      {formatDateTime(value)}
    </span>
  );
}
