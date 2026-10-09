import {
  AlertCircle,
  CircleCheckBig,
  Clock3,
  IndianRupee,
  RefreshCw,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMockDatabase } from "../../services/mockDatabase";
import { useAuth } from "../../store/AuthContext";
import type {
  BankAccount,
} from "../../types/banking";
import type {
  Payment,
} from "../../types/payment";
import {
  formatCompactCurrency,
  formatCurrency,
} from "../../utils/currency";
import { formatDateTime } from "../../utils/dates";

type DashboardData = {
  accounts: BankAccount[];
  payments: Payment[];
};

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  style: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: Payment["status"]) {
  if (status === "SUCCESSFUL") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "PENDING_AUTHORISATION" ||
    status === "AUTHORISATION_IN_PROGRESS"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "AWAITING_NEXT_AUTHORISER") {
    return "bg-violet-50 text-violet-700";
  }

  if (
    status === "AUTHORISED" ||
    status === "PROCESSING"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    status === "FAILED" ||
    status === "REJECTED" ||
    status === "AUTHORISATION_FAILED"
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function isDateInCurrentMonth(
  dateValue: string,
): boolean {
  const date = new Date(dateValue);
  const currentDate = new Date();

  return (
    date.getFullYear() ===
      currentDate.getFullYear() &&
    date.getMonth() === currentDate.getMonth()
  );
}

function MerchantDashboardPage() {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] =
    useState<DashboardData>({
      accounts: [],
      payments: [],
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const loadDashboardData = useCallback(() => {
    if (!user?.organisationId) {
      setDashboardData({
        accounts: [],
        payments: [],
      });

      setError(
        "The current user is not linked to a merchant organisation.",
      );

      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const database = getMockDatabase();

      const organisationAccounts =
        database.accounts.filter(
          (account) =>
            account.organisationId ===
              user.organisationId &&
            account.status === "ACTIVE",
        );

      const organisationPayments =
        database.payments
          .filter(
            (payment) =>
              payment.organisationId ===
              user.organisationId,
          )
          .sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime(),
          );

      setDashboardData({
        accounts: organisationAccounts,
        payments: organisationPayments,
      });
    } catch {
      setError(
        "The merchant dashboard information could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.organisationId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const metrics = useMemo<
    DashboardMetric[]
  >(() => {
    const totalAvailableBalance =
      dashboardData.accounts.reduce(
        (total, account) =>
          total + account.availableBalance,
        0,
      );

    const currentMonthPayments =
      dashboardData.payments.filter(
        (payment) =>
          isDateInCurrentMonth(
            payment.createdAt,
          ),
      );

    const currentMonthPaymentValue =
      currentMonthPayments.reduce(
        (total, payment) =>
          total + payment.amount,
        0,
      );

    const pendingPayments =
      dashboardData.payments.filter(
        (payment) =>
          payment.status ===
            "PENDING_AUTHORISATION" ||
          payment.status ===
            "AUTHORISATION_IN_PROGRESS" ||
          payment.status ===
            "AWAITING_NEXT_AUTHORISER",
      );

    const pendingPaymentValue =
      pendingPayments.reduce(
        (total, payment) =>
          total + payment.amount,
        0,
      );

    const successfulPayments =
      dashboardData.payments.filter(
        (payment) =>
          payment.status === "SUCCESSFUL",
      );

    const completedPayments =
      dashboardData.payments.filter(
        (payment) =>
          payment.status === "SUCCESSFUL" ||
          payment.status === "FAILED",
      );

    const successRate =
      completedPayments.length > 0
        ? Math.round(
            (successfulPayments.length /
              completedPayments.length) *
              100,
          )
        : 0;

    return [
      {
        label: "Available Balance",
        value: formatCompactCurrency(
          totalAvailableBalance,
        ),

detail:
  dashboardData.accounts.length === 0
    ? "No active account"
    : dashboardData.accounts.length === 1
      ? "Primary current account"
      : `${dashboardData.accounts.length} active accounts`,

        icon: WalletCards,
        style: "bg-blue-50 text-blue-700",
      },
      {
        label: "Payments This Month",
        value: formatCompactCurrency(
          currentMonthPaymentValue,
        ),
        detail: `${
          currentMonthPayments.length
        } payment instruction${
          currentMonthPayments.length === 1
            ? ""
            : "s"
        }`,
        icon: IndianRupee,
        style:
          "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Pending Approval",
        value: String(pendingPayments.length),
        detail: `${formatCompactCurrency(
          pendingPaymentValue,
        )} total value`,
        icon: Clock3,
        style: "bg-amber-50 text-amber-700",
      },
      {
        label: "Successful Payments",
        value: String(
          successfulPayments.length,
        ),
        detail:
          completedPayments.length > 0
            ? `${successRate}% payment success rate`
            : "No completed payments",
        icon: CircleCheckBig,
        style:
          "bg-violet-50 text-violet-700",
      },
    ];
  }, [dashboardData]);

  const recentPayments = useMemo(
    () => dashboardData.payments.slice(0, 5),
    [dashboardData.payments],
  );

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl">
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-slate-500"
            />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading merchant dashboard...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Welcome back
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            {user?.fullName}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {user?.organisationName}
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboardData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh dashboard
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

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

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-950">
              Recent payment activity
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Latest payment instructions for the
              current organisation.
            </p>
          </div>

          {recentPayments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {payment.beneficiaryName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {payment.paymentReference}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(
                        payment.createdAt,
                      )}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm font-bold text-slate-950">
                      {formatCurrency(
                        payment.amount,
                      )}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                        payment.status,
                      )}`}
                    >
                      {formatStatus(
                        payment.status,
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <IndianRupee
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-semibold text-slate-900">
                No payment activity
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Payment activity will appear here after
                the merchant initiates transactions.
              </p>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            Your access
          </h3>

          <p className="mt-5 text-sm text-slate-600">
            Current role
          </p>

          <p className="mt-1 font-semibold text-slate-950">
            {user?.role.replaceAll("_", " ")}
          </p>

          <p className="mt-5 text-sm text-slate-600">
            Organisation ID
          </p>

          <p className="mt-1 break-all font-semibold text-slate-950">
            {user?.organisationId ??
              "Not available"}
          </p>

          <p className="mt-5 text-sm text-slate-600">
            Active accounts
          </p>

          <p className="mt-1 font-semibold text-slate-950">
            {dashboardData.accounts.length}
          </p>

          <p className="mt-5 text-sm text-slate-600">
            Ledger balance
          </p>

          <p className="mt-1 font-semibold text-slate-950">
            {formatCurrency(
              dashboardData.accounts.reduce(
                (total, account) =>
                  total + account.ledgerBalance,
                0,
              ),
            )}
          </p>
        </article>
      </div>
    </section>
  );
}

export default MerchantDashboardPage;
