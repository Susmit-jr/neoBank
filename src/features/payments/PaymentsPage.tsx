import ApprovalTimeline from "../../components/status/ApprovalTimeline";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { processAllAuthorisedPayments } from "../../services/paymentProcessingService";
import {
  getPaymentProcessingEvents,
  getPaymentsByOrganisation,
} from "../../services/paymentService";
import { useAuth } from "../../store/AuthContext";
import type {
  Payment,
  PaymentProcessingEvent,
  PaymentStatus,
} from "../../types/payment";
import {
  formatCompactCurrency,
  formatCurrency,
} from "../../utils/currency";
import {
  formatDate,
  formatDateTime,
} from "../../utils/dates";

import { useNavigate } from "react-router-dom";

type StatusFilter = "ALL" | PaymentStatus;

const statusOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All statuses",
    value: "ALL",
  },
  {
    label: "Draft",
    value: "DRAFT",
  },
  {
    label: "Pending authorisation",
    value: "PENDING_AUTHORISATION",
  },
  {
    label: "Authorisation in progress",
    value: "AUTHORISATION_IN_PROGRESS",
  },
  {
    label: "Awaiting next authoriser",
    value: "AWAITING_NEXT_AUTHORISER",
  },
  {
    label: "Authorised",
    value: "AUTHORISED",
  },
  {
    label: "Processing",
    value: "PROCESSING",
  },
  {
    label: "Successful",
    value: "SUCCESSFUL",
  },
  {
    label: "Failed",
    value: "FAILED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
  {
    label: "Returned",
    value: "RETURNED",
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
  },
];

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: PaymentStatus) {
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

  if (status === "RETURNED") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getEventStyle(status: string) {
  if (status === "SUCCESSFUL") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "FAILED") {
    return "bg-red-100 text-red-700";
  }

  if (
    status === "PROCESSING" ||
    status === "VALIDATION_IN_PROGRESS"
  ) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
}

function PaymentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState<Payment[]>(
    [],
  );

  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);

  const [processingEvents, setProcessingEvents] =
    useState<PaymentProcessingEvent[]>([]);

  const selectedId = selectedPayment?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingDetails, setIsLoadingDetails] =
    useState(false);

  const [error, setError] = useState("");

  const canCreatePayment =
    user?.role === "MAKER" ||
    user?.role === "CORPORATE_ADMIN";

  async function loadPayments() {
    if (!user?.organisationId) {
      setError(
        "The current user is not mapped to an organisation.",
      );

      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const paymentData =
        await getPaymentsByOrganisation(
          user.organisationId,
        );

      setPayments(paymentData);
    } catch {
      setError(
        "Payment information could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, [user?.organisationId]);

  // Authorised payments are submitted to the bank and tracked until they settle.
  useEffect(() => {
    if (
      !user?.organisationId ||
      !payments.some(
        (payment) =>
          payment.status === "AUTHORISED" ||
          payment.status === "PROCESSING",
      )
    ) {
      return;
    }

    const organisationId = user.organisationId;

    const timer = window.setInterval(async () => {
      // Picks up AUTHORISED payments once; later ticks only refresh.
      void processAllAuthorisedPayments();

      const fresh =
        await getPaymentsByOrganisation(organisationId);

      setPayments(fresh);

      setSelectedPayment((current) =>
        current
          ? (fresh.find((item) => item.id === current.id) ??
            current)
          : current,
      );

      if (selectedId) {
        setProcessingEvents(
          await getPaymentProcessingEvents(selectedId),
        );
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [payments, user?.organisationId, selectedId]);

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        payment.status === statusFilter;

      const searchableContent = [
        payment.paymentReference,
        payment.beneficiaryName,
        payment.customerReference ?? "",
        payment.invoiceReference ?? "",
        payment.utrNumber ?? "",
        payment.paymentPurpose,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [payments, searchTerm, statusFilter]);

  const totalPaymentValue = payments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const pendingCount = payments.filter(
    (payment) =>
      payment.status === "PENDING_AUTHORISATION" ||
      payment.status ===
        "AUTHORISATION_IN_PROGRESS" ||
      payment.status ===
        "AWAITING_NEXT_AUTHORISER",
  ).length;

  const successfulCount = payments.filter(
    (payment) => payment.status === "SUCCESSFUL",
  ).length;

  const failedCount = payments.filter(
    (payment) =>
      payment.status === "FAILED" ||
      payment.status === "REJECTED" ||
      payment.status ===
        "AUTHORISATION_FAILED",
  ).length;

  async function openPaymentDetails(
    payment: Payment,
  ) {
    setSelectedPayment(payment);
    setProcessingEvents([]);
    setIsLoadingDetails(true);

    try {
      const events =
        await getPaymentProcessingEvents(payment.id);

      setProcessingEvents(events);
    } catch {
      setError(
        "Payment processing history could not be loaded.",
      );
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function closePaymentDetails() {
    setSelectedPayment(null);
    setProcessingEvents([]);
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
              Loading payments...
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
            Payment management
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Payments
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Initiate, track and review corporate payment
            instructions.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadPayments()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          {canCreatePayment && (
            
            <button
                type="button"
                onClick={() => {navigate("/merchant/payments/new");}}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                <Plus size={17} />
                Create payment
                </button>
            
          )}
        </div>
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
        <SummaryCard
          label="Total payment value"
          value={formatCompactCurrency(
            totalPaymentValue,
          )}
          icon="value"
        />

        <SummaryCard
          label="Pending authorisation"
          value={String(pendingCount)}
          icon="pending"
        />

        <SummaryCard
          label="Successful"
          value={String(successfulCount)}
          icon="successful"
        />

        <SummaryCard
          label="Failed or rejected"
          value={String(failedCount)}
          icon="failed"
        />
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Payment register
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {filteredPayments.length} payment records
              displayed
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as StatusFilter,
                );
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500"
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <label className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search payments"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 sm:w-72"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Payment",
                  "Beneficiary",
                  "Debit account",
                  "Mode",
                  "Amount",
                  "Scheduled date",
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
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="text-xs font-semibold text-slate-900">
                      {payment.paymentReference}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {payment.paymentType.replaceAll(
                        "_",
                        " ",
                      )}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <div className="min-w-52">
                      <p className="text-sm font-semibold text-slate-900">
                        {payment.beneficiaryName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          payment.maskedBeneficiaryAccountNumber
                        }
                      </p>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {payment.maskedDebitAccountNumber}
                    </p>

                    <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                      {payment.debitAccountName}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {payment.paymentMode}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-950">
                    {formatCurrency(payment.amount)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {formatDate(payment.scheduledDate)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                        payment.status,
                      )}`}
                    >
                      {formatStatus(payment.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        void openPaymentDetails(payment)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-14 text-center"
                  >
                    <FileText
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-4 font-semibold text-slate-900">
                      No payments found
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      No payment records match the selected
                      filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {selectedPayment && (
        <>
          <button
            type="button"
            aria-label="Close payment details"
            onClick={closePaymentDetails}
            className="fixed inset-0 z-30 bg-slate-950/50"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment details
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  {selectedPayment.paymentReference}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedPayment.paymentPurpose}
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentDetails}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close payment details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                    selectedPayment.status,
                  )}`}
                >
                  {formatStatus(selectedPayment.status)}
                </span>

                <p className="text-2xl font-bold text-slate-950">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>

              <div className="grid gap-5 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
                <DetailItem
                  label="Beneficiary"
                  value={
                    selectedPayment.beneficiaryName
                  }
                />

                <DetailItem
                  label="Beneficiary account"
                  value={
                    selectedPayment.maskedBeneficiaryAccountNumber
                  }
                />

                <DetailItem
                  label="Beneficiary bank"
                  value={
                    selectedPayment.beneficiaryBankName
                  }
                />

                <DetailItem
                  label="IFSC"
                  value={
                    selectedPayment.beneficiaryIfscCode
                  }
                />

                <DetailItem
                  label="Debit account"
                  value={
                    selectedPayment.maskedDebitAccountNumber
                  }
                />

                <DetailItem
                  label="Payment mode"
                  value={selectedPayment.paymentMode}
                />

                <DetailItem
                  label="Payment type"
                  value={selectedPayment.paymentType.replaceAll(
                    "_",
                    " ",
                  )}
                />

                <DetailItem
                  label="Priority"
                  value={selectedPayment.priority}
                />

                <DetailItem
                  label="Scheduled date"
                  value={formatDate(
                    selectedPayment.scheduledDate,
                  )}
                />

                <DetailItem
                  label="Created by"
                  value={selectedPayment.createdByName}
                />

                <DetailItem
                  label="Customer reference"
                  value={
                    selectedPayment.customerReference ??
                    "Not provided"
                  }
                />

                <DetailItem
                  label="Invoice reference"
                  value={
                    selectedPayment.invoiceReference ??
                    "Not provided"
                  }
                />

                <DetailItem
                  label="Applied MOP"
                  value={
                    selectedPayment.appliedMopVersion
                      ? `Version ${selectedPayment.appliedMopVersion}`
                      : "Not applicable"
                  }
                />

                <DetailItem
                  label="MOP stage"
                  value={
                    selectedPayment.currentApprovalStageSequence
                      ? `Stage ${selectedPayment.currentApprovalStageSequence} of ${selectedPayment.totalApprovalStages}`
                      : "Not applicable"
                  }
                />

                <DetailItem
                  label="UTR number"
                  value={
                    selectedPayment.utrNumber ??
                    "Not available"
                  }
                />

                <DetailItem
                  label="Bank transaction reference"
                  value={
                    selectedPayment.bankTransactionReference ??
                    "Not available"
                  }
                />
              </div>

              {selectedPayment.failureReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Failure reason
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-800">
                    {selectedPayment.failureReason}
                  </p>
                </div>
              )}

              {selectedPayment.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Rejection reason
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-800">
                    {selectedPayment.rejectionReason}
                  </p>
                </div>
              )}

              <ApprovalTimeline
                requestId={selectedPayment.id}
                createdByName={selectedPayment.createdByName}
                createdAt={selectedPayment.createdAt}
              />

              <div>
                <h4 className="text-base font-semibold text-slate-950">
                  Processing timeline
                </h4>

                {isLoadingDetails ? (
                  <div className="mt-5 flex items-center gap-3 text-sm text-slate-600">
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Loading processing history...
                  </div>
                ) : processingEvents.length > 0 ? (
                  <div className="mt-5 space-y-0">
                    {processingEvents.map(
                      (event, index) => (
                        <div
                          key={event.id}
                          className="relative flex gap-4 pb-7"
                        >
                          {index <
                            processingEvents.length - 1 && (
                            <div className="absolute left-[17px] top-9 h-full w-px bg-slate-200" />
                          )}

                          <div
                            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getEventStyle(
                              event.status,
                            )}`}
                          >
                            {event.status ===
                            "SUCCESSFUL" ? (
                              <CheckCircle2 size={17} />
                            ) : event.status ===
                              "FAILED" ? (
                              <AlertCircle size={17} />
                            ) : (
                              <Send size={16} />
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatStatus(
                                event.status,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDateTime(
                                event.eventTime,
                              )}
                            </p>

                            {event.failureReason && (
                              <p className="mt-2 text-sm text-red-700">
                                {event.failureReason}
                              </p>
                            )}

                            {event.utrNumber && (
                              <p className="mt-2 text-xs font-medium text-slate-600">
                                UTR: {event.utrNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                    Processing has not started for this
                    payment.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  icon:
    | "value"
    | "pending"
    | "successful"
    | "failed";
};

function SummaryCard({
  label,
  value,
  icon,
}: SummaryCardProps) {
  const Icon =
    icon === "value"
      ? CircleDollarSign
      : icon === "pending"
        ? Clock3
        : icon === "successful"
          ? CheckCircle2
          : AlertCircle;

  const iconStyle =
    icon === "value"
      ? "bg-blue-50 text-blue-700"
      : icon === "pending"
        ? "bg-amber-50 text-amber-700"
        : icon === "successful"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700";

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

      <p className="mt-2 break-words text-2xl font-bold text-slate-950">
        {value}
      </p>
    </article>
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

export default PaymentsPage;
