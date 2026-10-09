import {
  Building2,
  CircleDollarSign,
  FileWarning,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { getDashboardSnapshot } from "../../services/dashboardService";
import { useAuth } from "../../store/AuthContext";
import { formatCurrency } from "../../utils/currency";
import AttentionBanner from "./AttentionBanner";
import {
  EmptyRow,
  MetricGrid,
  Panel,
  StatusPill,
  TimeText,
} from "./DashboardParts";

function BankAdminDashboardPage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState(getDashboardSnapshot);

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
        count={snapshot.awaitingBank}
        label="application(s) from X Corp waiting for your approval"
        to="/bank-admin/onboarding"
      />

      <MetricGrid
        metrics={[
          {
            label: "Active organisations",
            value: String(snapshot.activeOrganisations),
            detail: `${snapshot.organisationsThisMonth} onboarded this month`,
            icon: Building2,
            style: "bg-blue-50 text-blue-700",
          },
          {
            label: "Pending authorisations",
            value: String(snapshot.pendingAuthorisations),
            detail: `${snapshot.paymentsPendingAuthorisation} payment(s), ${snapshot.beneficiariesPendingAuthorisation} beneficiary request(s)`,
            icon: ShieldCheck,
            style: "bg-amber-50 text-amber-700",
          },
          {
            label: "Payments settled",
            value: String(snapshot.successfulPayments),
            detail: `${formatCurrency(snapshot.successfulValue)} total value`,
            icon: CircleDollarSign,
            style: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Failed or rejected",
            value: String(snapshot.failedPayments),
            detail: `${snapshot.inFlightPayments} payment(s) in flight`,
            icon: FileWarning,
            style: "bg-red-50 text-red-700",
          },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent payments"
          description="Latest payment instructions across all businesses"
        >
          {snapshot.recentPayments.length === 0 ? (
            <EmptyRow message="No payments yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {snapshot.recentPayments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {payment.organisation}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {payment.reference} to {payment.beneficiary}
                    </p>
                    <TimeText value={payment.at} />
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <StatusPill status={payment.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent authorisations"
          description="Checker decisions confirmed through the bank"
        >
          {snapshot.recentAuthorisations.length === 0 ? (
            <EmptyRow message="No authorisations yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {snapshot.recentAuthorisations.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.by}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {item.reference}
                    </p>
                    <TimeText value={item.at} />
                  </div>

                  <StatusPill status={item.action} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}

export default BankAdminDashboardPage;
