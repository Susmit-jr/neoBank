import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getBankAdminOnboardingRecords,
  getNeoBankOnboardingQueue,
} from "../../services/onboardingService";
import type { AccountOpeningApplication } from "../../types/onboarding";
import { formatDateTime } from "../../utils/dates";
import { EmptyRow, StatusPill } from "../dashboard/DashboardParts";
import { statusLabel } from "./labels";

type ApplicationQueuePageProps = {
  reviewer: "NEOBANK" | "BANK";
  basePath: string;
};

function ApplicationQueuePage({
  reviewer,
  basePath,
}: ApplicationQueuePageProps) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<
    AccountOpeningApplication[]
  >([]);
  const [filter, setFilter] = useState<"AWAITING" | "ALL">("AWAITING");
  const [isLoading, setIsLoading] = useState(true);

  const awaitingStatuses =
    reviewer === "NEOBANK"
      ? ["SUBMITTED", "UNDER_NEOBANK_REVIEW"]
      : ["SUBMITTED_TO_BANK", "UNDER_BANK_REVIEW"];

  async function load() {
    const data =
      reviewer === "NEOBANK"
        ? await getNeoBankOnboardingQueue()
        : await getBankAdminOnboardingRecords();

    setApplications(data);
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewer]);

  const visible =
    filter === "ALL"
      ? applications
      : applications.filter((item) =>
          awaitingStatuses.includes(item.status),
        );

  const awaitingCount = applications.filter((item) =>
    awaitingStatuses.includes(item.status),
  ).length;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {reviewer === "NEOBANK" ? "Onboarding" : "Account opening"}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Applications
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {reviewer === "NEOBANK"
              ? "Businesses that applied on X Corp. Verify each application and send it to IndusInd Bank."
              : "Applications sent by X Corp. Approve to open the account and activate the business."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {(
          [
            ["AWAITING", `Awaiting review (${awaitingCount})`],
            ["ALL", "All applications"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg px-4 py-2 transition ${
              filter === value
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyRow
              message={
                filter === "AWAITING"
                  ? "No applications are waiting for your review."
                  : "No applications yet."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Reference",
                    "Business",
                    "Applicant",
                    "Submitted",
                    "Status",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                      {item.applicationReference}
                    </td>
                    <td className="px-5 py-4 text-slate-900">
                      {item.organisation.legalName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.applicant.fullName}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {item.submittedAt
                        ? formatDateTime(item.submittedAt)
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={statusLabel(item.status).toUpperCase()} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`${basePath}/application/${item.id}`)
                        }
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {awaitingStatuses.includes(item.status)
                          ? "Review"
                          : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default ApplicationQueuePage;
