import { useState, type SubmitEvent } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMockDatabase } from "../../services/mockDatabase";
import {
  createFundingRequest,
  getLinkedSourceAccounts,
  MAX_FUNDING_AMOUNT,
  MIN_FUNDING_AMOUNT,
} from "../../services/fundingService";
import { useAuth } from "../../store/AuthContext";
import type { FundingRequest } from "../../types/funding";
import { formatCurrency } from "../../utils/currency";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]";

function CreateAddBalancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const organisationId = user?.organisationId ?? "";
  const organisationName = user?.organisationName ?? "Your company";

  const accounts = getMockDatabase().accounts.filter(
    (account) =>
      account.organisationId === organisationId && account.status === "ACTIVE",
  );
  const sources = getLinkedSourceAccounts(organisationName);

  const [creditAccountId, setCreditAccountId] = useState(
    accounts.find((account) => account.isPrimary)?.id ?? accounts[0]?.id ?? "",
  );
  const [sourceAccountId, setSourceAccountId] = useState(sources[0].id);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [step, setStep] = useState<"FORM" | "REVIEW" | "DONE">("FORM");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [created, setCreated] = useState<FundingRequest | null>(null);

  const amountValue = Number(amount.replaceAll(",", ""));
  const account = accounts.find((item) => item.id === creditAccountId);
  const source = sources.find((item) => item.id === sourceAccountId);

  function handleReview(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!Number.isFinite(amountValue) || amountValue < MIN_FUNDING_AMOUNT) {
      setError(
        `Enter an amount of at least ${formatCurrency(MIN_FUNDING_AMOUNT)}.`,
      );
      return;
    }

    if (amountValue > MAX_FUNDING_AMOUNT) {
      setError(
        `You can add up to ${formatCurrency(MAX_FUNDING_AMOUNT)} in one request.`,
      );
      return;
    }

    setError("");
    setStep("REVIEW");
  }

  async function handleSubmit() {
    if (!user) return;

    setIsBusy(true);
    setError("");

    try {
      const request = await createFundingRequest({
        organisationId,
        organisationName,
        creditAccountId,
        sourceAccountId,
        amount: amountValue,
        remarks,
        createdByUserId: user.id,
        createdByName: user.fullName,
      });

      setCreated(request);
      setStep("DONE");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The request could not be submitted.",
      );
      setStep("FORM");
    } finally {
      setIsBusy(false);
    }
  }

  if (step === "DONE" && created) {
    return (
      <section className="mx-auto max-w-2xl">
        <article className="rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={32} />
          </span>
          <h2 className="mt-6 text-2xl font-bold text-slate-950">
            Request sent for authorisation
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your checkers will see it in their approval tray. The money is
            added once the required checkers have authorised.
          </p>
          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-lg font-bold">
            {created.fundingReference} · {formatCurrency(created.amount)}
          </p>
          <button
            type="button"
            onClick={() => navigate("/merchant/add-balance")}
            className="mt-6 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
          >
            View add balance requests
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() =>
          step === "REVIEW"
            ? setStep("FORM")
            : navigate("/merchant/add-balance")
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft size={16} />
        {step === "REVIEW" ? "Edit details" : "Add balance requests"}
      </button>

      <h2 className="mt-5 text-2xl font-bold text-slate-950">
        {step === "REVIEW" ? "Review request" : "Add balance"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {step === "REVIEW"
          ? "Check the details before sending them to your checkers."
          : "Choose where the money comes from and how much to add."}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {step === "FORM" ? (
        <form
          onSubmit={handleReview}
          className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Add money to
            </span>
            <select
              className={inputClass}
              value={creditAccountId}
              onChange={(event) => setCreditAccountId(event.target.value)}
            >
              {accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.accountName} | {item.maskedAccountNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Add money from
            </span>
            <select
              className={inputClass}
              value={sourceAccountId}
              onChange={(event) => setSourceAccountId(event.target.value)}
            >
              {sources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} | {item.bankName} {item.maskedAccountNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Amount
            </span>
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
            />
            <span className="mt-1.5 block text-xs text-slate-500">
              {formatCurrency(MIN_FUNDING_AMOUNT)} to{" "}
              {formatCurrency(MAX_FUNDING_AMOUNT)} per request
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Remarks (optional)
            </span>
            <input
              className={inputClass}
              maxLength={120}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
          >
            Review request
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="space-y-4">
            {(
              [
                ["Amount", formatCurrency(amountValue)],
                [
                  "Add money to",
                  `${account?.accountName} ${account?.maskedAccountNumber}`,
                ],
                [
                  "Add money from",
                  `${source?.name}, ${source?.bankName} ${source?.maskedAccountNumber}`,
                ],
                ["Remarks", remarks.trim() || "-"],
                ["Requested by", user?.fullName ?? ""],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleSubmit()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
          >
            {isBusy && <LoaderCircle size={18} className="animate-spin" />}
            Submit for authorisation
          </button>
        </div>
      )}
    </section>
  );
}

export default CreateAddBalancePage;
