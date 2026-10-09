import {
  AlertTriangle,
  ArrowLeft,
  Landmark,
  LoaderCircle,
  Send,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  COOL_OFF_LIMIT,
  COOL_OFF_MINUTES,
  getBeneficiaryCoolOff,
  getPaymentPreparationData,
  submitPayment,
  validatePayment,
  type PaymentPreparationData,
} from "../../services/paymentService";

import { useAuth } from "../../store/AuthContext";
import type {
  PaymentMode,
  PaymentPriority,
  PaymentType,
} from "../../types/payment";
import {
  formatCurrency,
} from "../../utils/currency";

type FormStep = "ENTRY" | "REVIEW" | "SUCCESS";

type PaymentFormData = {
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  priority: PaymentPriority;

  debitAccountId: string;
  beneficiaryId: string;

  amount: string;
  paymentPurpose: string;
  remarks: string;
  customerReference: string;
  invoiceReference: string;
  scheduledDate: string;
};

const initialFormData: PaymentFormData = {
  paymentType: "SINGLE",
  paymentMode: "NEFT",
  priority: "NORMAL",

  debitAccountId: "",
  beneficiaryId: "",

  amount: "",
  paymentPurpose: "",
  remarks: "",
  customerReference: "",
  invoiceReference: "",
  scheduledDate: new Date()
    .toISOString()
    .slice(0, 10),
};

function CreatePaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] =
    useState<PaymentFormData>(initialFormData);

  const [preparationData, setPreparationData] =
    useState<PaymentPreparationData>({
      debitAccounts: [],
      beneficiaries: [],
    });

  const [step, setStep] =
    useState<FormStep>("ENTRY");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isValidating, setIsValidating] =
    useState(false);

    const [isSubmitting, setIsSubmitting] =
  useState(false);

    const [submittedPaymentReference, setSubmittedPaymentReference] =
  useState("");

    const [submissionMessage, setSubmissionMessage] =
  useState("");

    const [appliedMopSummary, setAppliedMopSummary] =
  useState("");

    const [error, setError] = useState("");

    const [warnings, setWarnings] = useState<
    string[]
  >([]);

  const canCreatePayment =
    user?.role === "MAKER" ||
    user?.role === "CORPORATE_ADMIN";

  useEffect(() => {
    async function loadPreparationData() {
      if (!user?.organisationId) {
        setError(
          "The current user is not mapped to an organisation.",
        );

        setIsLoading(false);
        return;
      }

      try {
        const data =
          await getPaymentPreparationData(
            user.organisationId,
          );

        setPreparationData(data);

        setFormData((current) => ({
          ...current,

          debitAccountId:
            current.debitAccountId ||
            data.debitAccounts[0]?.id ||
            "",

          beneficiaryId:
            current.beneficiaryId ||
            data.beneficiaries[0]?.id ||
            "",
        }));
      } catch {
        setError(
          "Payment preparation information could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPreparationData();
  }, [user?.organisationId]);

  function handleInputChange(
    event: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >,
  ) {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    setError("");
    setWarnings([]);
  }

  function performBasicValidation():
    | string
    | null {
    if (!formData.debitAccountId) {
      return "Select a debit account.";
    }

    if (!formData.beneficiaryId) {
      return "Select a beneficiary.";
    }

    const amount = Number(formData.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return "Enter a valid payment amount greater than zero.";
    }

    if (!formData.paymentPurpose.trim()) {
      return "Payment purpose is required.";
    }

    if (!formData.scheduledDate) {
      return "Payment date is required.";
    }

    return null;
  }

  async function handleReview(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!user?.organisationId) {
      setError(
        "The current user is not mapped to an organisation.",
      );

      return;
    }

    const validationError =
      performBasicValidation();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setWarnings([]);
    setIsValidating(true);

    try {
      const result = await validatePayment({
        organisationId:
          user.organisationId,

        debitAccountId:
          formData.debitAccountId,

        beneficiaryId:
          formData.beneficiaryId,

        amount: Number(formData.amount),

        paymentMode:
          formData.paymentMode,

        scheduledDate:
          formData.scheduledDate,

        paymentPurpose:
          formData.paymentPurpose,

        invoiceReference:
          formData.invoiceReference,
      });

      if (!result.isValid) {
        setError(result.errors.join(" "));
        return;
      }

      setWarnings(result.warnings);
      setStep("REVIEW");
    } catch {
      setError(
        "The payment could not be validated. Please try again.",
      );
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSubmission() {
  if (
    !user ||
    !user.organisationId ||
    !canCreatePayment
  ) {
    setError(
      "You do not have permission to submit payments.",
    );
    return;
  }

  setError("");
  setIsSubmitting(true);

  try {
    const result = await submitPayment({
      organisationId: user.organisationId,

      paymentType: formData.paymentType,
      paymentMode: formData.paymentMode,
      priority: formData.priority,

      debitAccountId: formData.debitAccountId,
      beneficiaryId: formData.beneficiaryId,

      amount: Number(formData.amount),
      currency: "INR",

      paymentPurpose: formData.paymentPurpose,
      remarks: formData.remarks,
      customerReference: formData.customerReference,
      invoiceReference: formData.invoiceReference,

      scheduledDate: formData.scheduledDate,

      createdByUserId: user.id,
      createdByName: user.fullName,
    });

    setSubmittedPaymentReference(
      result.payment.paymentReference,
    );

    setSubmissionMessage(result.message);

    setAppliedMopSummary(
      `${result.appliedMop.mopReference}, Version ${result.appliedMop.version}, ${result.appliedMop.stages.length} approval stage(s)`,
    );

    setStep("SUCCESS");
  } catch (submissionError) {
    setError(
      submissionError instanceof Error
        ? submissionError.message
        : "The payment could not be submitted.",
    );
  } finally {
    setIsSubmitting(false);
  }
}

  const selectedAccount =
    preparationData.debitAccounts.find(
      (account) =>
        account.id === formData.debitAccountId,
    );

  const selectedBeneficiary =
    preparationData.beneficiaries.find(
      (beneficiary) =>
        beneficiary.id === formData.beneficiaryId,
    );

  if (!canCreatePayment) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-bold text-red-900">
            Access restricted
          </h2>

          <p className="mt-3 text-sm text-red-800">
            Your role does not permit payment
            initiation.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/merchant/payments")
            }
            className="mt-6 rounded-xl bg-red-800 px-5 py-3 text-sm font-semibold text-white"
          >
            Return to payments
          </button>
        </div>
      </section>
    );
  }

  if (step === "SUCCESS") {
  return (
    <section className="mx-auto max-w-3xl">
      <article className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Send size={31} />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-emerald-700">
          Payment submitted
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          {submissionMessage}
        </h2>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          The transaction has been routed to the eligible
          authoriser according to the approval rule.
        </p>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment reference
          </p>

          <p className="mt-2 font-bold text-slate-950">
            {submittedPaymentReference}
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Approval rule
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {appliedMopSummary}
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current status
          </p>

          <p className="mt-2 text-sm font-semibold text-amber-700">
            PENDING AUTHORISATION
          </p>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              navigate("/merchant/payments");
            }}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            View payments
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData({
                ...initialFormData,
                scheduledDate: new Date()
                  .toISOString()
                  .slice(0, 10),

                debitAccountId:
                  preparationData.debitAccounts[0]?.id ??
                  "",

                beneficiaryId:
                  preparationData.beneficiaries[0]?.id ??
                  "",
              });

              setWarnings([]);
              setError("");
              setSubmittedPaymentReference("");
              setSubmissionMessage("");
              setAppliedMopSummary("");
              setStep("ENTRY");
            }}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Create another payment
          </button>
        </div>
      </article>
    </section>
  );
}

  if (isLoading) {
    return (
      <section className="mx-auto max-w-5xl">
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <LoaderCircle className="mx-auto animate-spin text-slate-500" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading account and beneficiary details...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => {
            if (step === "REVIEW") {
              setStep("ENTRY");
              setError("");
              return;
            }

            navigate("/merchant/payments");
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} />

          {step === "REVIEW"
            ? "Return to payment details"
            : "Return to payments"}
        </button>

        <p className="mt-6 text-sm font-medium text-slate-500">
          Payment initiation
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-950">
          {step === "ENTRY"
            ? "Create payment"
            : "Review payment"}
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          {step === "ENTRY"
            ? "Enter the payment instruction details."
            : "Verify the instruction before submission for approval."}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {step === "ENTRY" && (
        <form onSubmit={handleReview}>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Landmark size={22} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Payment information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Only active accounts and beneficiaries
                  are available.
                </p>
              </div>
            </div>

            {preparationData.debitAccounts.length ===
              0 && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No active debit account is available.
              </div>
            )}

            {preparationData.beneficiaries.length ===
              0 && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No active beneficiary is available.
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <SelectField
                label="Payment type"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                options={[
                  {
                    value: "SINGLE",
                    label: "Single payment",
                  },
                  {
                    value: "VENDOR",
                    label: "Vendor payment",
                  },
                  {
                    value: "SALARY",
                    label: "Salary payment",
                  },
                  {
                    value: "TAX",
                    label: "Tax payment",
                  },
                  {
                    value: "SCHEDULED",
                    label: "Scheduled payment",
                  },
                ]}
              />

              <SelectField
                label="Debit account"
                name="debitAccountId"
                value={formData.debitAccountId}
                onChange={handleInputChange}
                options={preparationData.debitAccounts.map(
                  (account) => ({
                    value: account.id,
                    label: `${account.maskedAccountNumber} | ${formatCurrency(
                      account.availableBalance,
                    )}`,
                  }),
                )}
              />

              <SelectField
                label="Beneficiary"
                name="beneficiaryId"
                value={formData.beneficiaryId}
                onChange={handleInputChange}
                options={preparationData.beneficiaries.map(
                  (beneficiary) => ({
                    value: beneficiary.id,
                    label: `${beneficiary.beneficiaryName} | ${beneficiary.maskedAccountNumber}`,
                  }),
                )}
              />

              {getBeneficiaryCoolOff(selectedBeneficiary).active && (
                <div
                  role="status"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 md:col-span-2"
                >
                  <p className="font-semibold">
                    New beneficiary: payment limit applies
                  </p>
                  <p className="mt-1">
                    {selectedBeneficiary?.beneficiaryName} was
                    added recently. For the first {COOL_OFF_MINUTES}{" "}
                    minutes you can pay up to ₹
                    {COOL_OFF_LIMIT.toLocaleString("en-IN")} to
                    this beneficiary.
                  </p>
                </div>
              )}

              <TextField
                label="Payment amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                inputMode="decimal"
                required
              />

              <SelectField
                label="Payment mode"
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                options={[
                  {
                    value: "NEFT",
                    label: "NEFT",
                  },
                  {
                    value: "RTGS",
                    label: "RTGS",
                  },
                  {
                    value: "IMPS",
                    label: "IMPS",
                  },
                ]}
              />

              <SelectField
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                options={[
                  {
                    value: "NORMAL",
                    label: "Normal",
                  },
                  {
                    value: "URGENT",
                    label: "Urgent",
                  },
                ]}
              />

              <TextField
                label="Payment date"
                name="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                placeholder=""
                required
              />

              <TextField
                label="Invoice reference"
                name="invoiceReference"
                value={formData.invoiceReference}
                onChange={handleInputChange}
                placeholder="Optional"
              />

              <TextField
                label="Customer reference"
                name="customerReference"
                value={formData.customerReference}
                onChange={handleInputChange}
                placeholder="Optional"
              />

              <TextField
                label="Payment purpose"
                name="paymentPurpose"
                value={formData.paymentPurpose}
                onChange={handleInputChange}
                placeholder="Enter payment purpose"
                required
              />

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Remarks
                </span>

                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={250}
                  placeholder="Add optional payment remarks"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
                />

                <p className="mt-2 text-right text-xs text-slate-400">
                  {formData.remarks.length}/250
                </p>
              </label>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={
                  isValidating ||
                  preparationData.debitAccounts
                    .length === 0 ||
                  preparationData.beneficiaries
                    .length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isValidating && (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )}

                {isValidating
                  ? "Validating..."
                  : "Review payment"}
              </button>
            </div>
          </article>
        </form>
      )}

      {step === "REVIEW" && (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Send size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-950">
                Confirm payment instruction
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                The approval rule will be determined
                when the payment is submitted.
              </p>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Potential duplicate detected
                  </p>

                  <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-800">
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 rounded-2xl bg-slate-50 p-6 sm:grid-cols-2">
            <ReviewItem
              label="Debit account"
              value={
                selectedAccount
                  ? `${selectedAccount.accountName} | ${selectedAccount.maskedAccountNumber}`
                  : "Not available"
              }
            />

            <ReviewItem
              label="Available balance"
              value={
                selectedAccount
                  ? formatCurrency(
                      selectedAccount.availableBalance,
                    )
                  : "Not available"
              }
            />

            <ReviewItem
              label="Beneficiary"
              value={
                selectedBeneficiary
                  ?.beneficiaryName ??
                "Not available"
              }
            />

            <ReviewItem
              label="Beneficiary account"
              value={
                selectedBeneficiary
                  ?.maskedAccountNumber ??
                "Not available"
              }
            />

            <ReviewItem
              label="Payment amount"
              value={formatCurrency(
                Number(formData.amount),
              )}
            />

            <ReviewItem
              label="Payment mode"
              value={formData.paymentMode}
            />

            <ReviewItem
              label="Payment type"
              value={formData.paymentType.replaceAll(
                "_",
                " ",
              )}
            />

            <ReviewItem
              label="Priority"
              value={formData.priority}
            />

            <ReviewItem
              label="Payment date"
              value={formData.scheduledDate}
            />

            <ReviewItem
              label="Payment purpose"
              value={formData.paymentPurpose}
            />

            <ReviewItem
              label="Invoice reference"
              value={
                formData.invoiceReference ||
                "Not provided"
              }
            />

            <ReviewItem
              label="Customer reference"
              value={
                formData.customerReference ||
                "Not provided"
              }
            />

            <ReviewItem
              label="Remarks"
              value={
                formData.remarks || "Not provided"
              }
            />

            <ReviewItem
              label="Created by"
              value={user?.fullName ?? ""}
            />
          </div>

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                On submission, your approval rule will be
                applied and the transaction will be routed to
                eligible authorisers. The payment will not be
                processed until all required authorisations are
                completed.
            </div>

          <div className="mt-8 flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setStep("ENTRY");
                setError("");
              }}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit details
            </button>

            <button
  type="button"
  onClick={() => void handleSubmission()}
  disabled={isSubmitting}
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isSubmitting ? (
    <LoaderCircle
      size={18}
      className="animate-spin"
    />
  ) : (
    <Send size={18} />
  )}

  {isSubmitting
    ? "Submitting..."
    : "Submit for approval"}
</button>

          </div>
        </article>
      )}
    </section>
  );
}

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  name: keyof PaymentFormData;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  options: SelectOption[];
};

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
      >
        {options.length === 0 && (
          <option value="">No option available</option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type TextFieldProps = {
  label: string;
  name: keyof PaymentFormData;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  placeholder: string;
  type?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "email"
    | "tel";
  required?: boolean;
};

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode = "text",
  required = false,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-600">*</span>
        )}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

type ReviewItemProps = {
  label: string;
  value: string;
};

function ReviewItem({
  label,
  value,
}: ReviewItemProps) {
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

export default CreatePaymentPage;
