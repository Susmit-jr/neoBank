import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  RefreshCw,
  ShieldCheck,
  UserRoundPlus,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useSearchParams,
} from "react-router-dom";
import {
  getApprovalTrayItems,
  rejectRequest,
} from "../../services/approvalService";
import {
  createBankAuthorisationSession,
  createPaymentBankAuthorisationSession,
  getOpenBankSession,
} from "../../services/authorisationService";
import { useAuth } from "../../store/AuthContext";
import type {
  ApprovalTrayItem,
} from "../../types/approval";
import { formatCurrency } from "../../utils/currency";
import { formatDateTime } from "../../utils/dates";

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: string) {
  if (status === "PENDING_AUTHORISATION") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "AUTHORISATION_IN_PROGRESS") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "AWAITING_NEXT_AUTHORISER") {
    return "bg-violet-50 text-violet-700";
  }

  if (
    status === "ACTIVE" ||
    status === "SUCCESSFUL" ||
    status === "AUTHORISED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "REJECTED" ||
    status === "FAILED" ||
    status === "AUTHORISATION_FAILED"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (status === "RETURNED") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-slate-100 text-slate-700";
}

function ApprovalQueuePage() {
  const { user } = useAuth();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const requestedItemId =
    searchParams.get("requestId");

  const [approvalItems, setApprovalItems] =
    useState<ApprovalTrayItem[]>([]);

  const [selectedItem, setSelectedItem] =
    useState<ApprovalTrayItem | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isAuthorising, setIsAuthorising] =
    useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isRejectModalOpen, setIsRejectModalOpen] =
    useState(false);

  const [rejectionRemarks, setRejectionRemarks] =
    useState("");

  const [rejectionError, setRejectionError] =
    useState("");

  const [isRejecting, setIsRejecting] =
    useState(false);

  // Re-evaluate unfinished bank sessions when the user comes back to this tab.
  const [, setFocusTick] = useState(0);

  useEffect(() => {
    const refresh = () => setFocusTick((tick) => tick + 1);

    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const openBankSession =
    user?.id && selectedItem
      ? getOpenBankSession(selectedItem.requestId, user.id)
      : undefined;

  const loadApprovals = useCallback(async () => {
    if (!user?.id || !user.organisationId) {
      setApprovalItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const trayItems =
        await getApprovalTrayItems(
          user.organisationId,
          user.id,
        );

      setApprovalItems(trayItems);

      setSelectedItem((currentSelection) => {
        if (!currentSelection) {
          return null;
        }

        return (
          trayItems.find(
            (item) =>
              item.requestId ===
              currentSelection.requestId,
          ) ?? null
        );
      });
    } catch {
      setError(
        "The approval tray could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organisationId]);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  useEffect(() => {
    if (!requestedItemId) {
      return;
    }

    if (approvalItems.length === 0) {
      return;
    }

    const requestedItem = approvalItems.find(
      (item) =>
        item.requestId === requestedItemId,
    );

    if (requestedItem) {
      setSelectedItem(requestedItem);
      return;
    }

    setError(
      "This request is not available in your approval tray. It may have already been actioned or assigned to another authoriser.",
    );

    setSearchParams({}, { replace: true });
  }, [
    approvalItems,
    requestedItemId,
    setSearchParams,
  ]);

  useEffect(() => {
    function handleBankAuthorisationMessage(
      event: MessageEvent,
    ) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        event.data?.source !==
        "NEOBANK_BANK_AUTHORISATION"
      ) {
        return;
      }

      const message =
        typeof event.data?.message === "string"
          ? event.data.message
          : "Bank authorisation completed.";

      setSuccessMessage(message);
      setSelectedItem(null);
      setSearchParams({}, { replace: true });

      void loadApprovals();
    }

    window.addEventListener(
      "message",
      handleBankAuthorisationMessage,
    );

    return () => {
      window.removeEventListener(
        "message",
        handleBankAuthorisationMessage,
      );
    };
  }, [loadApprovals, setSearchParams]);

  function openReviewPanel(
    item: ApprovalTrayItem,
  ) {
    setSelectedItem(item);
    setError("");
    setSuccessMessage("");

    setSearchParams(
      {
        requestId: item.requestId,
      },
      {
        replace: true,
      },
    );
  }

  function closeReviewPanel() {
    setSelectedItem(null);
    setIsRejectModalOpen(false);
    setRejectionRemarks("");
    setRejectionError("");

    if (requestedItemId) {
      setSearchParams({}, { replace: true });
    }
  }

    async function handleAuthorise() {
  if (!user || !selectedItem) {
    setError(
      "The request or authoriser details are unavailable.",
    );
    return;
  }

  setError("");
  setSuccessMessage("");
  setIsAuthorising(true);

  try {
    const session =
      selectedItem.requestType === "PAYMENT"
        ? await createPaymentBankAuthorisationSession(
            selectedItem.requestId,
            user.id,
          )
        : await createBankAuthorisationSession(
            selectedItem.requestId,
            user.id,
          );

    const popupWidth = 620;
    const popupHeight = 780;

    const popupLeft =
      window.screenX +
      Math.max(
        0,
        (window.outerWidth - popupWidth) / 2,
      );

    const popupTop =
      window.screenY +
      Math.max(
        0,
        (window.outerHeight - popupHeight) / 2,
      );

    const bankPopup = window.open(
      `/bank-authorisation/${session.id}`,
      `bank-authorisation-${session.id}`,
      [
        `width=${popupWidth}`,
        `height=${popupHeight}`,
        `left=${popupLeft}`,
        `top=${popupTop}`,
        "resizable=yes",
        "scrollbars=yes",
      ].join(","),
    );

    if (!bankPopup) {
      // Popup blocked or unsupported (e.g. mobile): continue in this tab.
      window.location.assign(
        `/bank-authorisation/${session.id}?return=${encodeURIComponent(
          window.location.pathname,
        )}`,
      );
      return;
    }

    bankPopup.focus();

    void loadApprovals();
  } catch (authorisationError) {
    setError(
      authorisationError instanceof Error
        ? authorisationError.message
        : "The bank authorisation session could not be created.",
    );
  } finally {
    setIsAuthorising(false);
  }
}



  function openRejectModal() {
    if (!selectedItem) {
      return;
    }

    setRejectionRemarks("");
    setRejectionError("");
    setIsRejectModalOpen(true);
  }

  function closeRejectModal() {
    if (isRejecting) {
      return;
    }

    setIsRejectModalOpen(false);
    setRejectionRemarks("");
    setRejectionError("");
  }

  async function handleReject() {
    if (!user || !selectedItem) {
      setRejectionError(
        "The request or authoriser details are unavailable.",
      );
      return;
    }

    const normalizedRemarks =
      rejectionRemarks.trim();

    if (!normalizedRemarks) {
      setRejectionError(
        "Rejection remarks are mandatory.",
      );
      return;
    }

    setRejectionError("");
    setIsRejecting(true);

    try {
      const result =
        await rejectRequest({
          requestKind: selectedItem.requestType,
          requestId: selectedItem.requestId,

          actionedByUserId: user.id,
          actionedByName: user.fullName,

          remarks: normalizedRemarks,
        });

      setSuccessMessage(result.message);

      setIsRejectModalOpen(false);
      setSelectedItem(null);
      setRejectionRemarks("");
      setSearchParams({}, { replace: true });

      await loadApprovals();
    } catch (rejectionFailure) {
      setRejectionError(
        rejectionFailure instanceof Error
          ? rejectionFailure.message
          : "The request could not be rejected.",
      );
    } finally {
      setIsRejecting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl">
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw
              size={24}
              className="mx-auto animate-spin text-slate-500"
            />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading approval tray...
            </p>
          </div>
        </div>
      </section>
    );
  }

  const beneficiaryRequestCount =
    approvalItems.filter(
      (item) =>
        item.requestType === "BENEFICIARY",
    ).length;

  const paymentRequestCount =
    approvalItems.filter(
      (item) => item.requestType === "PAYMENT",
    ).length;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Authorisation management
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Approval tray
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Review beneficiary and payment requests
            assigned to you under the applicable MOP.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadApprovals()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh tray
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

      {successMessage && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <SummaryCard
          label="Total pending actions"
          value={String(approvalItems.length)}
          type="TOTAL"
        />

        <SummaryCard
          label="Beneficiary requests"
          value={String(beneficiaryRequestCount)}
          type="BENEFICIARY"
        />

        <SummaryCard
          label="Payment requests"
          value={String(paymentRequestCount)}
          type="PAYMENT"
        />
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-950">
            Requests awaiting your action
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Only requests where you are eligible under
            the current MOP stage are displayed.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Request type",
                  "Reference",
                  "Request details",
                  "Amount",
                  "MOP stage",
                  "Progress",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {approvalItems.map((item) => {
                const completedApprovals =
                  item.decisions.filter(
                    (decision) =>
                      decision.action === "APPROVED",
                  ).length;

                return (
                  <tr
                    key={item.approvalStage.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <RequestTypeBadge
                        requestType={item.requestType}
                      />
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-xs font-semibold text-slate-900">
                        {item.requestReference}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(
                          item.submittedAt,
                        )}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="min-w-52">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.subtitle}
                        </p>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      {item.requestType === "PAYMENT" &&
                      item.amount !== undefined ? (
                        <p className="text-sm font-bold text-slate-950">
                          {formatCurrency(item.amount)}
                        </p>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Not applicable
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="min-w-44 text-sm font-medium text-slate-900">
                        {item.approvalStage.stageName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Stage{" "}
                        {
                          item.approvalStage
                            .stageSequence
                        }
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {completedApprovals} of{" "}
                        {
                          item.approvalStage
                            .requiredApprovals
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        approvals completed
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          item.requestStatus,
                        )}`}
                      >
                        {formatStatus(
                          item.requestStatus,
                        )}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          openReviewPanel(item)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={15} />
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}

              {approvalItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-14 text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <CheckCircle2 size={27} />
                    </div>

                    <p className="mt-4 font-semibold text-slate-900">
                      Your approval tray is clear
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      No requests currently require your
                      action.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {selectedItem && (
        <>
          <button
            type="button"
            aria-label="Close approval review"
            onClick={closeReviewPanel}
            className="fixed inset-0 z-30 bg-slate-950/50"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <RequestTypeBadge
                  requestType={
                    selectedItem.requestType
                  }
                />

                <h3 className="mt-4 text-xl font-bold text-slate-950">
                  {selectedItem.title}
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  {selectedItem.requestReference}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReviewPanel}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close review"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <span
                className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                  selectedItem.requestStatus,
                )}`}
              >
                {formatStatus(
                  selectedItem.requestStatus,
                )}
              </span>

              <div className="rounded-2xl bg-slate-50 p-5">
                <DetailItem
                  label="Request details"
                  value={selectedItem.subtitle}
                />

                {selectedItem.requestType ===
                  "PAYMENT" &&
                  selectedItem.amount !==
                    undefined && (
                    <div className="mt-5">
                      <DetailItem
                        label="Payment amount"
                        value={formatCurrency(
                          selectedItem.amount,
                        )}
                      />
                    </div>
                  )}
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Current MOP requirement
                </p>

                <p className="mt-3 font-semibold text-blue-950">
                  {
                    selectedItem.approvalStage
                      .stageName
                  }
                </p>

                <p className="mt-2 text-sm leading-6 text-blue-900">
                  Stage{" "}
                  {
                    selectedItem.approvalStage
                      .stageSequence
                  }{" "}
                  requires{" "}
                  {
                    selectedItem.approvalStage
                      .requiredApprovals
                  }{" "}
                  approval(s).
                </p>
              </div>

              {openBankSession && (
                <div
                  role="status"
                  className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm leading-6 text-orange-900"
                >
                  <p className="font-semibold">
                    Authorisation not completed
                  </p>
                  <p className="mt-1">
                    You started authorising this request with the
                    bank but did not finish. Resume to continue
                    where you left off. The session expires at{" "}
                    {formatDateTime(openBankSession.expiresAt)}.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Selecting Authorise will open the
                bank-controlled authentication window. Use
                your separate bank corporate net banking
                credentials to complete the authorisation.
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openRejectModal}
                  className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Reject
                </button>

                <button
                  type="button"
                  disabled={isAuthorising}
                  onClick={() =>
                    void handleAuthorise()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck size={17} />

                  {isAuthorising
                    ? "Opening..."
                    : openBankSession
                      ? "Resume authorisation"
                      : "Authorise"}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {isRejectModalOpen && selectedItem && (
        <>
          <button
            type="button"
            aria-label="Close rejection dialog"
            onClick={closeRejectModal}
            className="fixed inset-0 z-50 bg-slate-950/60"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-request-title"
            className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          >
            <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-red-700">
                    Reject request
                  </p>

                  <h2
                    id="reject-request-title"
                    className="mt-2 text-xl font-bold text-slate-950"
                  >
                    Confirm rejection
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={isRejecting}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500"
                  aria-label="Close rejection dialog"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Request
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {selectedItem.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedItem.requestReference}
                </p>
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Rejection remarks
                  <span className="ml-1 text-red-600">
                    *
                  </span>
                </span>

                <textarea
                  value={rejectionRemarks}
                  onChange={(event) => {
                    setRejectionRemarks(
                      event.target.value,
                    );

                    setRejectionError("");
                  }}
                  rows={5}
                  maxLength={500}
                  placeholder="Enter the reason for rejecting this request"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
              </label>

              {rejectionError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  {rejectionError}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={isRejecting}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleReject()
                  }
                  disabled={isRejecting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isRejecting
                    ? "Rejecting..."
                    : "Confirm rejection"}
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  type: "TOTAL" | "BENEFICIARY" | "PAYMENT";
};

function SummaryCard({
  label,
  value,
  type,
}: SummaryCardProps) {
  const Icon =
    type === "BENEFICIARY"
      ? UserRoundPlus
      : type === "PAYMENT"
        ? CircleDollarSign
        : Clock3;

  const iconStyle =
    type === "BENEFICIARY"
      ? "bg-blue-50 text-blue-700"
      : type === "PAYMENT"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-amber-50 text-amber-700";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
      >
        <Icon size={21} />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

type RequestTypeBadgeProps = {
  requestType: ApprovalTrayItem["requestType"];
};

function RequestTypeBadge({
  requestType,
}: RequestTypeBadgeProps) {
  if (requestType === "PAYMENT") {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CircleDollarSign size={14} />
        Payment
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
      <UserRoundPlus size={14} />
      Beneficiary
    </span>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default ApprovalQueuePage;
