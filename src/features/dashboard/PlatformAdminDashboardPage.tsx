import {
  Activity,
  Building2,
  CircleCheckBig,
  Users,
} from "lucide-react";
import { useAuth } from "../../store/AuthContext";

const metrics = [
  {
    label: "Merchant Organisations",
    value: "36",
    detail: "4 onboarding requests",
    icon: Building2,
    style: "bg-blue-50 text-blue-700",
  },
  {
    label: "Platform Users",
    value: "284",
    detail: "267 active users",
    icon: Users,
    style: "bg-violet-50 text-violet-700",
  },
  {
    label: "Integration Health",
    value: "98.7%",
    detail: "All critical services available",
    icon: Activity,
    style: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Resolved Requests",
    value: "42",
    detail: "During the current cycle",
    icon: CircleCheckBig,
    style: "bg-amber-50 text-amber-700",
  },
];

function PlatformAdminDashboardPage() {
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
          Platform overview
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Merchant onboarding, product configuration, integration
          monitoring and support-management capabilities will be
          added in the upcoming stages.
        </p>
      </div>
    </section>
  );
}

export default PlatformAdminDashboardPage;
