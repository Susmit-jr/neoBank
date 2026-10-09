import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getMockDatabase } from "../../services/mockDatabase";
import { formatDateTime } from "../../utils/dates";
import { StatusPill } from "../dashboard/DashboardParts";

type AuditEvent = {
  id: string;
  at: string;
  category: string;
  reference: string;
  actor: string;
  detail: string;
  status: string;
};

function AuditPage() {
  const [search, setSearch] = useState("");

  const events = useMemo(() => {
    const database = getMockDatabase();
    const all: AuditEvent[] = [];

    database.approvalDecisions.forEach((decision) =>
      all.push({
        id: decision.id,
        at: decision.actionedAt,
        category: "Authorisation",
        reference: decision.requestReference,
        actor: decision.actionedByName,
        detail: decision.remarks ?? "Confirmed through the bank",
        status: decision.action,
      }),
    );

    database.paymentProcessingEvents.forEach((event) =>
      all.push({
        id: event.id,
        at: event.eventTime,
        category: "Payment processing",
        reference: event.paymentReference,
        actor: "Bank",
        detail:
          event.failureReason ??
          event.utrNumber ??
          event.bankTransactionReference ??
          "",
        status: event.status,
      }),
    );

    database.organisations.forEach((organisation) =>
      all.push({
        id: organisation.id,
        at: organisation.activatedAt,
        category: "Onboarding",
        reference: organisation.organisationReference,
        actor: organisation.createdByName,
        detail: `${organisation.legalName} (${organisation.corporateId})`,
        status: "ACTIVE",
      }),
    );

    return all.sort(
      (first, second) =>
        new Date(second.at).getTime() -
        new Date(first.at).getTime(),
    );
  }, []);

  const visible = events.filter((event) =>
    [event.category, event.reference, event.actor, event.detail, event.status]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-slate-500">
        Platform activity
      </p>
      <h2 className="mt-1 text-2xl font-bold text-slate-950">
        Audit events
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Authorisations, payment processing and onboarding across
        every business, newest first.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-900">
            {visible.length} event(s)
          </p>

          <label className="relative block w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Time", "Event", "Reference", "Actor", "Details", "Status"].map(
                  (heading) => (
                    <th key={heading} className="px-5 py-3 font-semibold">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {visible.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    {formatDateTime(event.at)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {event.category}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {event.reference}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {event.actor}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {event.detail}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={event.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AuditPage;
