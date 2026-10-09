import { useEffect, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApprovalTimeline from "../../components/status/ApprovalTimeline";
import CancelRequestButton from "../../components/status/CancelRequestButton";
import { getFundingRequests } from "../../services/fundingService";
import { useAuth } from "../../store/AuthContext";
import type { FundingRequest } from "../../types/funding";
import { formatCurrency } from "../../utils/currency";
import { formatDateTime } from "../../utils/dates";
import { EmptyRow, StatusPill } from "../dashboard/DashboardParts";

function AddBalancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [selected, setSelected] = useState<FundingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canCreate =
    user?.role === "MAKER" || user?.role === "CORPORATE_ADMIN";

  async function load() {
    if (!user?.organisationId) {
      return;
    }

    const data = await getFundingRequests(user.organisationId);
    setRequests(data);
    setSelected((current) =>
      current ? (data.find((item) => item.id === current.id) ?? null) : null,
    );
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organisationId]);

  // Keep the list moving while a request is being collected and credited.
  const inFlight = requests.some(
    (item) => item.status === "AUTHORISED" || item.status === "PROCESSING",
  );

  useEffect(() => {
    if (!inFlight) {
      return;
    }

    const timer = window.setInterval(() => void load(), 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFlight]);

  const steps = selected
    ? ([
        ["Requested", selected.createdAt],
        ["Authorised", selected.authorisedAt],
        ["Collecting from your bank", selected.processingStartedAt],
        ["Added to your account", selected.completedAt],
      ] as const)
    : [];

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Fund your account
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Add balance
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Move money from a linked bank account into your account. A maker
            raises the request and your checkers authorise it.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => navigate("/merchant/add-balance/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              <Plus size={16} />
              Add balance
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : requests.length === 0 ? (
          <div className="p-6">
            <EmptyRow message="No add balance requests yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Reference",
                    "Add money from",
                    "Credit account",
                    "Amount",
                    "Requested",
                    "Status",
                    "",
                  ].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                      {item.fundingReference}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {item.sourceBankName} {item.maskedSourceAccountNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {item.maskedCreditAccountNumber}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <>
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-30 bg-slate-950/40"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Add balance
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">
                  {selected.fundingReference}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <StatusPill status={selected.status} />
                <p className="text-2xl font-bold text-slate-950">
                  {formatCurrency(selected.amount)}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-5">
                {(
                  [
                    [
                      "Add money from",
                      `${selected.sourceAccountName}, ${selected.sourceBankName} ${selected.maskedSourceAccountNumber}`,
                    ],
                    [
                      "Credit account",
                      `${selected.creditAccountName} ${selected.maskedCreditAccountNumber}`,
                    ],
                    ["Requested by", selected.createdByName],
                    ["Remarks", selected.remarks ?? "-"],
                    ["Bank reference", selected.bankReference ?? "-"],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {selected.status === "REJECTED" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                  A checker rejected this request: {selected.rejectionReason}.
                  It has been cancelled. Raise a new request to try again.
                </div>
              )}

              <CancelRequestButton
                requestKind="FUNDING"
                requestId={selected.id}
                createdByUserId={selected.createdByUserId}
                status={selected.status}
                onCancelled={() => {
                  setSelected(null);
                  void load();
                }}
              />

              <ApprovalTimeline
                requestId={selected.id}
                createdByName={selected.createdByName}
                createdAt={selected.createdAt}
              />

              {(selected.status === "AUTHORISED" ||
                selected.status === "PROCESSING" ||
                selected.status === "SUCCESSFUL") && (
                <div>
                  <h4 className="text-base font-semibold text-slate-950">
                    Progress
                  </h4>

                  <ol className="mt-4 space-y-3">
                    {steps.map(([label, at]) => (
                      <li
                        key={label}
                        className={`flex items-center justify-between rounded-xl border p-3 text-sm ${
                          at
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 text-slate-400"
                        }`}
                      >
                        <span className="font-semibold">{label}</span>
                        <span className="text-xs">
                          {at ? formatDateTime(at) : "Pending"}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </section>
  );
}

export default AddBalancePage;
