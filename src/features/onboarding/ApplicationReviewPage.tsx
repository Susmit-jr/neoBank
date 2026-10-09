import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  bankDecision,
  getOnboardingApplicationById,
  neoBankDecision,
} from "../../services/onboardingService";
import { useAuth } from "../../store/AuthContext";
import type { AccountOpeningApplication } from "../../types/onboarding";
import { StatusPill } from "../dashboard/DashboardParts";
import ApplicationSummary from "./ApplicationSummary";
import { statusLabel } from "./labels";

type ApplicationReviewPageProps = {
  reviewer: "NEOBANK" | "BANK";
  basePath: string;
};

function ApplicationReviewPage({
  reviewer,
  basePath,
}: ApplicationReviewPageProps) {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const { user } = useAuth();

  const [application, setApplication] =
    useState<AccountOpeningApplication | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    async function load() {
      if (!applicationId) return;
      const found = await getOnboardingApplicationById(applicationId);
      setApplication(found ?? null);
    }

    void load();
  }, [applicationId]);

  if (!application) {
    return (
      <p className="text-sm text-slate-500">Loading application...</p>
    );
  }

  const awaiting =
    reviewer === "NEOBANK"
      ? ["SUBMITTED", "UNDER_NEOBANK_REVIEW"].includes(application.status)
      : ["SUBMITTED_TO_BANK", "UNDER_BANK_REVIEW"].includes(
          application.status,
        );

  async function decide(decision: "APPROVE" | "REJECT") {
    if (!user || !application) return;

    setIsBusy(true);
    setError("");

    const actor = { userId: user.id, name: user.fullName };

    try {
      const updated =
        reviewer === "NEOBANK"
          ? await neoBankDecision(application.id, decision, actor, reason)
          : await bankDecision(application.id, decision, actor, reason);

      setApplication(updated);
      setRejecting(false);
      setReason("");
      setMessage(
        decision === "REJECT"
          ? "The application has been rejected."
          : reviewer === "NEOBANK"
            ? "Application approved and sent to IndusInd Bank."
            : "Application approved. The account is open and the business can now log in.",
      );
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "The decision could not be recorded.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <button
        type="button"
        onClick={() => navigate(basePath)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft size={16} />
        All applications
      </button>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {application.applicationReference}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            {application.organisation.legalName}
          </h2>
        </div>

        <StatusPill status={statusLabel(application.status).toUpperCase()} />
      </div>

      {message && (
        <p
          role="status"
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {application.status === "REJECTED" && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Rejected:{" "}
          {application.bankReview.rejectionReason ??
            application.neoBankReview.remarks}
        </p>
      )}

      <div className="mt-6">
        <ApplicationSummary application={application} />
      </div>

      {awaiting && (
        <div className="sticky bottom-4 mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          {rejecting ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Reason for rejection
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </label>

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void decide("REJECT")}
                  className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                >
                  Confirm rejection
                </button>
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                {reviewer === "NEOBANK"
                  ? "Verify the details and documents, then send to IndusInd Bank."
                  : "Approving opens the account and activates the business and its users."}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  className="rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void decide("APPROVE")}
                  className="rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
                >
                  {isBusy
                    ? "Working..."
                    : reviewer === "NEOBANK"
                      ? "Approve and send to bank"
                      : "Approve and open account"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ApplicationReviewPage;
