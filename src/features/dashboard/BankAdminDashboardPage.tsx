import {
  Building2,
  CircleDollarSign,
  FileWarning,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../store/AuthContext";

const metrics = [
  {
    label: "Active Organisations",
    value: "24",
    detail: "2 awaiting activation",
    icon: Building2,
    style: "bg-blue-50 text-blue-700",
  },
  {
    label: "Pending Authorisations",
    value: "18",
    detail: "5 require attention",
    icon: ShieldCheck,
    style: "bg-amber-50 text-amber-700",
  },
  {
    label: "Payments Processing",
    value: "126",
    detail: "₹4.82 Cr total value",
    icon: CircleDollarSign,
    style: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Open Exceptions",
    value: "7",
    detail: "3 high priority",
    icon: FileWarning,
    style: "bg-red-50 text-red-700",
  },
];

function BankAdminDashboardPage() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">
          Welcome back
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-950">
          {user?.fullName}
        </h2>
      </div>

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

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">
          Operational overview
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Organisation monitoring, MOP management, bank
          authorisations and payment-processing controls will be
          added in the upcoming stages.
        </p>
      </div>
    </section>
  );
}

export default BankAdminDashboardPage;
