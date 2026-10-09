import { useState, type SubmitEvent } from "react";
import { CheckCircle2, Circle, Trash2, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { trackApplication } from "../../services/onboardingService";
import type { AccountOpeningApplication } from "../../types/onboarding";
import { formatDateTime } from "../../utils/dates";
import { getMockDatabase } from "../../services/mockDatabase";
import { humanise, statusLabel } from "./labels";
import PublicShell from "./PublicShell";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

function progressOf(application: AccountOpeningApplication): number {
  switch (application.status) {
    case "SUBMITTED":
    case "UNDER_NEOBANK_REVIEW":
      return 1;
    case "SUBMITTED_TO_BANK":
    case "UNDER_BANK_REVIEW":
      return 2;
    case "ACCOUNT_OPENED":
    case "ACCOUNT_LINKED":
      return 4;
    default:
      return 1;
  }
}

const HIDDEN_KEY = "neobank_hidden_demo_applications";

function readHidden(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function TrackPage() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(
    params.get("reference") ?? "",
  );
  const [email, setEmail] = useState("");
  const [application, setApplication] =
    useState<AccountOpeningApplication | null>(null);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [hidden, setHidden] = useState<string[]>(readHidden);

  // Every submitted application is listed here automatically for quick checks.
  const demoApplications = getMockDatabase()
    .accountOpeningApplications.filter(
      (item) => item.status !== "DRAFT" && !hidden.includes(item.id),
    )
    .sort(
      (first, second) =>
        new Date(second.submittedAt ?? second.updatedAt).getTime() -
        new Date(first.submittedAt ?? first.updatedAt).getTime(),
    );

  function removeFromList(id: string) {
    const next = [...hidden, id];
    setHidden(next);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await check(reference, email);
  }

  async function check(checkReference: string, checkEmail: string) {
    setIsBusy(true);
    setMessage("");

    try {
      const found = await trackApplication(checkReference, checkEmail);

      if (!found) {
        setApplication(null);
        setMessage(
          "We could not find an application with that reference and email.",
        );
        return;
      }

      setApplication(found);
    } finally {
      setIsBusy(false);
    }
  }

  const rejected = application?.status === "REJECTED";
  const progress = application ? progressOf(application) : 0;

  const stages = [
    ["Application submitted", application?.submittedAt],
    [
      "Verified by X Corp",
      application?.neoBankReview.reviewCompletedAt,
    ],
    ["Final approval", application?.bankReview.reviewCompletedAt],
    ["Account opened", application?.openedAccount?.openedOrLinkedAt],
  ] as const;

  return (
    <PublicShell>
      <h1 className="text-3xl font-bold tracking-[-0.03em]">
        Track your application
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the reference you received when you applied and the work email
        you used.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Application reference
          </span>
          <input
            required
            className={inputClass}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="ACCAPP-20261009-1234"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Work email
          </span>
          <input
            required
            type="email"
            className={inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={isBusy}
          className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {isBusy ? "Checking..." : "Check status"}
        </button>
      </form>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Demo applications
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Every application submitted in this browser appears here. Select
          one to check its status.
        </p>

        {demoApplications.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No applications yet. Open an account to see it listed here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {demoApplications.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-slate-900">
                    {item.applicationReference}
                    <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {statusLabel(item.status)}
                    </span>
                  </p>
                  <p className="truncate text-slate-500">
                    {item.organisation.legalName} · {item.applicant.workEmail}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReference(item.applicationReference);
                      setEmail(item.applicant.workEmail);
                      void check(
                        item.applicationReference,
                        item.applicant.workEmail,
                      );
                    }}
                    className="rounded-lg border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-700 hover:text-white"
                  >
                    Use
                  </button>

                  <button
                    type="button"
                    aria-label={`Remove ${item.applicationReference} from the list`}
                    onClick={() => removeFromList(item.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {message}
        </p>
      )}

      {application && (
        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              {application.organisation.legalName}
            </p>
            <p className="mt-1 text-lg font-bold">
              {application.applicationReference}
            </p>

            <ol className="mt-6 space-y-5">
              {stages.map(([label, at], index) => {
                const done = index < progress;
                const stoppedHere = rejected && index === progress;

                return (
                  <li key={label} className="flex items-start gap-3">
                    {stoppedHere ? (
                      <XCircle className="mt-0.5 text-red-600" size={20} />
                    ) : done ? (
                      <CheckCircle2
                        className="mt-0.5 text-emerald-600"
                        size={20}
                      />
                    ) : (
                      <Circle className="mt-0.5 text-slate-300" size={20} />
                    )}

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          done || stoppedHere
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {stoppedHere ? "Application rejected" : label}
                      </p>
                      {done && at && (
                        <p className="text-xs text-slate-500">
                          {formatDateTime(at)}
                        </p>
                      )}
                      {stoppedHere && (
                        <p className="mt-1 text-sm text-red-700">
                          {application.bankReview.rejectionReason ??
                            application.neoBankReview.remarks}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {application.openedAccount && (
            <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Your account is open</h2>

              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  ["Account number", application.openedAccount.accountNumber],
                  ["IFSC", application.openedAccount.ifscCode],
                  ["Corporate ID", application.openedAccount.corporateId],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-8 text-sm font-semibold text-slate-900">
                Business Banking logins
              </h3>

              <ul className="mt-3 divide-y divide-slate-100">
                {application.issuedCredentials?.map((credential) => (
                  <li key={credential.userId} className="py-4 text-sm">
                    <p className="font-semibold">
                      {credential.fullName}
                      <span className="ml-2 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {humanise(credential.role)}
                      </span>
                    </p>
                    <p className="mt-1 text-slate-600">
                      User ID {credential.username} · Password{" "}
                      {credential.initialPassword}
                    </p>
                    {credential.bankCredentials && (
                      <p className="mt-1 text-slate-600">
                        Bank authorisation: {credential.bankCredentials.corporateId}{" "}
                        / {credential.bankCredentials.bankUserId} /{" "}
                        {credential.bankCredentials.password}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <Link
                to="/login/merchant"
                className="mt-4 inline-block rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Log in to Business Banking
              </Link>
            </section>
          )}
        </div>
      )}
    </PublicShell>
  );
}

export default TrackPage;
