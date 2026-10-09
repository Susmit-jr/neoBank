import {
  Activity,
  Building2,
  ClipboardList,
  RefreshCw,
  Users,
} from "lucide-react";
import { useState } from "react";
import { getDashboardSnapshot } from "../../services/dashboardService";
import { useAuth } from "../../store/AuthContext";
import AttentionBanner from "./AttentionBanner";
import {
  EmptyRow,
  MetricGrid,
  Panel,
  StatusPill,
  TimeText,
} from "./DashboardParts";

function PlatformAdminDashboardPage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState(getDashboardSnapshot);

  const maxStatusCount = Math.max(
    1,
    ...snapshot.paymentsByStatus.map((item) => item.count),
  );

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Welcome back
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            {user?.fullName}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setSnapshot(getDashboardSnapshot())}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <AttentionBanner
        count={snapshot.awaitingNeoBank}
        label="new application(s) waiting for your review"
        to="/platform-admin/onboarding"
      />

      <MetricGrid
        metrics={[
          {
            label: "Businesses on X Corp",
            value: String(snapshot.activeOrganisations),
            detail: `${snapshot.organisationsThisMonth} onboarded this month`,
            icon: Building2,
            style: "bg-blue-50 text-blue-700",
          },
          {
            label: "Business Banking users",
            value: String(snapshot.activeBusinessUsers),
            detail: "Active makers, checkers and admins",
            icon: Users,
            style: "bg-violet-50 text-violet-700",
          },
          {
            label: "Payment success rate",
            value:
              snapshot.successRate === null
                ? "N/A"
                : `${snapshot.successRate}%`,
            detail: `${snapshot.successfulPayments} settled, ${snapshot.failedPayments} failed or rejected`,
            icon: Activity,
            style: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Open applications",
            value: String(snapshot.openApplications),
            detail: `${snapshot.totalApplications} applications in total`,
            icon: ClipboardList,
            style: "bg-amber-50 text-amber-700",
          },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recently onboarded"
          description="Businesses that went live most recently"
        >
          {snapshot.recentOnboardings.length === 0 ? (
            <EmptyRow message="No businesses onboarded yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {snapshot.recentOnboardings.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.organisation}
                    </p>
                    <p className="text-xs text-slate-500">
                      Corporate ID {item.corporateId}
                    </p>
                  </div>

                  <TimeText value={item.at} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Payments by status"
          description="Where payments across the platform stand today"
        >
          {snapshot.paymentsByStatus.length === 0 ? (
            <EmptyRow message="No payments yet." />
          ) : (
            <ul className="space-y-4">
              {snapshot.paymentsByStatus.map((item) => (
                <li key={item.status}>
                  <div className="flex items-center justify-between text-sm">
                    <StatusPill status={item.status} />
                    <span className="font-semibold text-slate-900">
                      {item.count}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${(item.count / maxStatusCount) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}

export default PlatformAdminDashboardPage;
