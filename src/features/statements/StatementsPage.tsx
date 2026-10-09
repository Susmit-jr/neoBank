import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { getMockDatabase } from "../../services/mockDatabase";
import { buildStatement, statementToCsv } from "../../services/statementService";
import { useAuth } from "../../store/AuthContext";
import { formatCurrency } from "../../utils/currency";
import { formatDate, formatDateTime } from "../../utils/dates";
import { EmptyRow } from "../dashboard/DashboardParts";

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function periodFor(kind: string): [string, string] {
  const today = new Date();

  if (kind === "7") {
    return [isoDay(new Date(today.getTime() - 6 * 86400000)), isoDay(today)];
  }

  if (kind === "THIS_MONTH") {
    return [isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), isoDay(today)];
  }

  if (kind === "LAST_MONTH") {
    return [
      isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      isoDay(new Date(today.getFullYear(), today.getMonth(), 0)),
    ];
  }

  return [isoDay(new Date(today.getTime() - 29 * 86400000)), isoDay(today)];
}

const periods = [
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
  ["THIS_MONTH", "This month"],
  ["LAST_MONTH", "Last month"],
  ["CUSTOM", "Custom"],
] as const;

const inputClass =
  "rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]";

function StatementsPage() {
  const { user } = useAuth();

  const accounts = getMockDatabase().accounts.filter(
    (account) => account.organisationId === user?.organisationId,
  );

  const [accountId, setAccountId] = useState(
    accounts.find((account) => account.isPrimary)?.id ?? accounts[0]?.id ?? "",
  );
  const [kind, setKind] = useState<string>("30");
  const [customFrom, setCustomFrom] = useState(periodFor("30")[0]);
  const [customTo, setCustomTo] = useState(periodFor("30")[1]);

  const [from, to] = kind === "CUSTOM" ? [customFrom, customTo] : periodFor(kind);

  const statement = useMemo(
    () => (from && to && from <= to ? buildStatement(accountId, from, to) : undefined),
    [accountId, from, to],
  );

  function download() {
    if (!statement) return;

    const blob = new Blob([statementToCsv(statement)], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `statement-${statement.account.accountNumber}-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Account statement</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Statements</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            View, download or print the statement for any of your accounts.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={download}
            disabled={!statement}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={16} />
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!statement}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            <Printer size={16} />
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="no-print mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Account
          </span>
          <select
            className={`${inputClass} min-w-64`}
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountName} | {account.accountNumber}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Period
          </span>
          <select
            className={inputClass}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            {periods.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {kind === "CUSTOM" && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                From
              </span>
              <input
                type="date"
                className={inputClass}
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                To
              </span>
              <input
                type="date"
                className={inputClass}
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </label>
          </>
        )}
      </div>

      {!statement ? (
        <div className="mt-6">
          <EmptyRow message="Choose an account and a valid period (the start date must not be after the end date)." />
        </div>
      ) : (
        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Account statement
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">
                {statement.account.accountName}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {formatDate(statement.from)} to {formatDate(statement.to)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {(
                [
                  ["Account number", statement.account.accountNumber],
                  ["CIF ID", statement.cifId],
                  ["IFSC", statement.account.ifscCode],
                  ["Branch", statement.account.branchName],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            {(
              [
                ["Opening balance", statement.openingBalance, "text-slate-950"],
                ["Total credits", statement.totalCredits, "text-emerald-700"],
                ["Total debits", statement.totalDebits, "text-red-700"],
                ["Closing balance", statement.closingBalance, "text-slate-950"],
              ] as [string, number, string][]
            ).map(([label, value, tone]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className={`mt-1 text-lg font-bold ${tone}`}>
                  {formatCurrency(value)}
                </p>
              </div>
            ))}
          </div>

          {statement.lines.length === 0 ? (
            <div className="mt-6">
              <EmptyRow message="There are no transactions in this period." />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {["Date", "Description", "Reference", "Debit", "Credit", "Balance"].map(
                      (heading, index) => (
                        <th
                          key={heading}
                          className={`px-4 py-3 font-semibold ${index >= 3 ? "text-right" : ""}`}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {statement.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDateTime(line.transactionDate)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {line.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {line.counterpartyName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {line.transactionReference}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-red-700">
                        {line.type === "DEBIT" ? formatCurrency(line.amount) : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">
                        {line.type === "CREDIT" ? formatCurrency(line.amount) : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(line.balanceAfter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-6 text-xs text-slate-400">
            Generated on {formatDateTime(new Date().toISOString())}. This is a
            computer-generated statement.
          </p>
        </article>
      )}
    </section>
  );
}

export default StatementsPage;
