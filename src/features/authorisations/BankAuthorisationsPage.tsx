import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { getMockDatabase } from "../../services/mockDatabase";
import { formatDateTime } from "../../utils/dates";
import { EmptyRow, StatusPill } from "../dashboard/DashboardParts";

function BankAuthorisationsPage() {
  const [, setTick] = useState(0);
  const database = getMockDatabase();

  const sessions = [...database.bankAuthorisationSessions].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );

  const organisationName = (id: string) =>
    database.organisations.find((item) => item.id === id)
      ?.legalName ?? "Unknown organisation";

  const userName = (id: string) =>
    database.users.find((item) => item.id === id)?.fullName ??
    "Unknown user";

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Bank operations
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Authorisations
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Every secure authorisation window opened by a business
            checker, with its outcome.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTick((tick) => tick + 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {sessions.length === 0 ? (
          <div className="p-6">
            <EmptyRow message="No authorisation sessions yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {[
                    "Started",
                    "Business",
                    "Request",
                    "Checker",
                    "Expires",
                    "Outcome",
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
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {formatDateTime(session.createdAt)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {organisationName(session.organisationId)}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {session.requestReference}
                      <span className="ml-2 text-xs text-slate-400">
                        {session.requestType === "PAYMENT"
                          ? "Payment"
                          : session.requestType === "ADD_BALANCE"
                            ? "Add balance"
                            : "Beneficiary"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {userName(session.platformUserId)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {formatDateTime(session.expiresAt)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill
                        status={
                          new Date() > new Date(session.expiresAt) &&
                          (session.status === "CREATED" ||
                            session.status === "AUTHENTICATED")
                            ? "EXPIRED"
                            : session.status
                        }
                      />
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

export default BankAuthorisationsPage;
