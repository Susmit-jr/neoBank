import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
  LoaderCircle,
  Send,
  UserRoundPlus,
} from "lucide-react";
import {
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  checkDuplicateBeneficiary,
  createBeneficiary,
} from "../../services/beneficiaryService";
import { useAuth } from "../../store/AuthContext";
import type { BeneficiaryAccountType } from "../../types/banking";

type FormStep = "ENTRY" | "REVIEW" | "SUCCESS";

type BeneficiaryFormData = {
  beneficiaryCode: string;
  beneficiaryName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  accountType: BeneficiaryAccountType;
  bankName: string;
  branchName: string;
  ifscCode: string;
  email: string;
  mobileNumber: string;
};

const initialFormData: BeneficiaryFormData = {
  beneficiaryCode: "",
  beneficiaryName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  accountType: "CURRENT",
  bankName: "",
  branchName: "",
  ifscCode: "",
  email: "",
  mobileNumber: "",
};

const sampleBeneficiaries = [
  {
    name: "Sterling Packaging Industries Pvt Ltd",
    code: "STERLING",
    bank: "HDFC Bank",
    branch: "Andheri East, Mumbai",
    ifsc: "HDFC0000314",
  },
  {
    name: "Greenfield Agro Traders",
    code: "GREENFLD",
    bank: "ICICI Bank",
    branch: "Nariman Point, Mumbai",
    ifsc: "ICIC0000007",
  },
  {
    name: "Bluewave Logistics LLP",
    code: "BLUEWAVE",
    bank: "Axis Bank",
    branch: "Connaught Place, New Delhi",
    ifsc: "UTIB0000004",
  },
  {
    name: "Nimbus Software Services Pvt Ltd",
    code: "NIMBUS",
    bank: "State Bank of India",
    branch: "Koramangala, Bengaluru",
    ifsc: "SBIN0001234",
  },
];

function buildSampleBeneficiary(): BeneficiaryFormData {
  const sample =
    sampleBeneficiaries[
      Math.floor(Math.random() * sampleBeneficiaries.length)
    ];

  const accountNumber = String(
    Math.floor(1e11 + Math.random() * 9e11),
  );

  return {
    beneficiaryCode: `${sample.code}${Math.floor(Math.random() * 90 + 10)}`,
    beneficiaryName: sample.name,
    accountNumber,
    confirmAccountNumber: accountNumber,
    accountType: "CURRENT",
    bankName: sample.bank,
    branchName: sample.branch,
    ifscCode: sample.ifsc,
    email: `accounts@${sample.code.toLowerCase()}.in`,
    mobileNumber: `98${Math.floor(1e7 + Math.random() * 9e7)}`,
  };
}

function CreateBeneficiaryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] =
    useState<BeneficiaryFormData>(initialFormData);

  const [step, setStep] = useState<FormStep>("ENTRY");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [createdReference, setCreatedReference] =
    useState("");
  const [appliedMopSummary, setAppliedMopSummary] =
    useState("");

  const canCreateBeneficiary =
    user?.role === "MAKER" ||
    user?.role === "CORPORATE_ADMIN";

                            function handleInputChange(
                            event: ChangeEvent<
                                HTMLInputElement | HTMLSelectElement
                            >,
                            ) {
                            setFormData((current) => ({
                                ...current,
                                [event.target.name]: event.target.value,
                            }));

                            setError("");
                            }

  function validateForm(): string | null {
    if (!formData.beneficiaryCode.trim()) {
      return "Beneficiary code is required.";
    }

    if (!formData.beneficiaryName.trim()) {
      return "Beneficiary name is required.";
    }

    const normalizedAccountNumber =
      formData.accountNumber
        .trim()
        .replaceAll(" ", "");

    if (!/^\d{6,18}$/.test(normalizedAccountNumber)) {
      return "Account number must contain between 6 and 18 digits.";
    }

    if (
      normalizedAccountNumber !==
      formData.confirmAccountNumber
        .trim()
        .replaceAll(" ", "")
    ) {
      return "Account number and confirmation do not match.";
    }

    if (!formData.bankName.trim()) {
      return "Bank name is required.";
    }

    if (!formData.branchName.trim()) {
      return "Branch name is required.";
    }

    const normalizedIfsc = formData.ifscCode
      .trim()
      .toUpperCase();

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      return "Enter a valid 11-character IFSC code.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email,
      )
    ) {
      return "Enter a valid email address.";
    }

    if (
      formData.mobileNumber &&
      !/^[6-9]\d{9}$/.test(formData.mobileNumber)
    ) {
      return "Enter a valid 10-digit mobile number.";
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

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsChecking(true);

    try {
      const duplicateResult =
        await checkDuplicateBeneficiary(
          user.organisationId,
          formData.accountNumber,
          formData.ifscCode,
        );

      if (duplicateResult.isDuplicate) {
        setError(
          duplicateResult.message ??
            "A duplicate beneficiary already exists.",
        );
        return;
      }

      setStep("REVIEW");
    } catch {
      setError(
        "The beneficiary could not be validated. Please try again.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function handleSubmission() {
    if (
      !user ||
      !user.organisationId ||
      !canCreateBeneficiary
    ) {
      setError(
        "You do not have permission to create beneficiaries.",
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await createBeneficiary({
        organisationId: user.organisationId,

        beneficiaryCode:
          formData.beneficiaryCode,
        beneficiaryName:
          formData.beneficiaryName,

        accountNumber: formData.accountNumber,
        accountType: formData.accountType,

        bankName: formData.bankName,
        branchName: formData.branchName,
        ifscCode: formData.ifscCode,

        email: formData.email,
        mobileNumber: formData.mobileNumber,

        createdByUserId: user.id,
        createdByName: user.fullName,
      });

      setCreatedReference(
        result.beneficiary.beneficiaryReference,
      );

      setAppliedMopSummary(
        `${result.appliedMop.mopReference}, Version ${result.appliedMop.version}, ${result.appliedMop.stages.length} approval stage(s)`,
      );

      setStep("SUCCESS");
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError(
          "Beneficiary submission could not be completed.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canCreateBeneficiary) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-bold text-red-900">
            Access restricted
          </h2>

          <p className="mt-3 text-sm text-red-800">
            Your role does not permit beneficiary creation.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/merchant/beneficiaries")
            }
            className="mt-6 rounded-xl bg-red-800 px-5 py-3 text-sm font-semibold text-white"
          >
            Return to beneficiaries
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
            <CheckCircle2 size={32} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Submitted successfully
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Beneficiary sent for authorisation
          </h2>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            The request will appear in the approval tray of
            eligible authorisers according to the approval rule.
          </p>

          <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Beneficiary reference
            </p>

            <p className="mt-2 font-bold text-slate-950">
              {createdReference}
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

          <button
            type="button"
            onClick={() =>
              navigate("/merchant/beneficiaries")
            }
            className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            View beneficiaries
          </button>
        </article>
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

            navigate("/merchant/beneficiaries");
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          {step === "REVIEW"
            ? "Return to beneficiary details"
            : "Return to beneficiaries"}
        </button>

        <p className="mt-6 text-sm font-medium text-slate-500">
          Beneficiary management
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-950">
          {step === "ENTRY"
            ? "Add beneficiary"
            : "Review beneficiary"}
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          {step === "ENTRY"
            ? "Enter the beneficiary bank-account details."
            : "Verify the details before submitting for authorisation."}
        </p>

        {step === "ENTRY" && (
          <button
            type="button"
            onClick={() => {
              setFormData(buildSampleBeneficiary());
              setError("");
            }}
            className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Fill sample data
          </button>
        )}
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
                <UserRoundPlus size={22} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Beneficiary information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Fields marked as required must be completed.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                label="Beneficiary code"
                name="beneficiaryCode"
                value={formData.beneficiaryCode}
                onChange={handleInputChange}
                placeholder="Example: ORBTECH"
                required
              />

              <FormField
                label="Beneficiary name"
                name="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={handleInputChange}
                placeholder="Enter beneficiary name"
                required
              />

              <FormField
                label="Account number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                inputMode="numeric"
                required
              />

              <FormField
                label="Confirm account number"
                name="confirmAccountNumber"
                value={formData.confirmAccountNumber}
                onChange={handleInputChange}
                placeholder="Re-enter account number"
                inputMode="numeric"
                required
              />

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Account type
                </span>

                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="CURRENT">
                    Current account
                  </option>
                  <option value="SAVINGS">
                    Savings account
                  </option>
                  <option value="CASH_CREDIT">
                    Cash credit
                  </option>
                  <option value="OVERDRAFT">
                    Overdraft
                  </option>
                </select>
              </label>

              <FormField
                label="IFSC code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                placeholder="Example: ABCD0123456"
                maxLength={11}
                required
              />

              <FormField
                label="Bank name"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                required
              />

              <FormField
                label="Branch name"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                placeholder="Enter branch name"
                required
              />

              <FormField
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Optional"
              />

              <FormField
                label="Mobile number"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="Optional"
                inputMode="numeric"
                maxLength={10}
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isChecking}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChecking && (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )}

                {isChecking
                  ? "Validating..."
                  : "Review beneficiary"}
              </button>
            </div>
          </article>
        </form>
      )}

      {step === "REVIEW" && (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Landmark size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-950">
                Confirm beneficiary details
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                The applicable approval flow will be determined
                from your approval rule during submission.
              </p>
            </div>
          </div>

          <div className="grid gap-6 rounded-2xl bg-slate-50 p-6 sm:grid-cols-2">
            <ReviewItem
              label="Beneficiary code"
              value={formData.beneficiaryCode.toUpperCase()}
            />

            <ReviewItem
              label="Beneficiary name"
              value={formData.beneficiaryName}
            />

            <ReviewItem
              label="Account number"
              value={formData.accountNumber}
            />

            <ReviewItem
              label="Account type"
              value={formData.accountType.replaceAll(
                "_",
                " ",
              )}
            />

            <ReviewItem
              label="Bank name"
              value={formData.bankName}
            />

            <ReviewItem
              label="Branch name"
              value={formData.branchName}
            />

            <ReviewItem
              label="IFSC"
              value={formData.ifscCode.toUpperCase()}
            />

            <ReviewItem
              label="Email"
              value={formData.email || "Not provided"}
            />

            <ReviewItem
              label="Mobile number"
              value={
                formData.mobileNumber || "Not provided"
              }
            />

            <ReviewItem
              label="Submitted by"
              value={user?.fullName ?? ""}
            />
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            On submission, the beneficiary will be sent to the
            eligible authoriser tray based on your approval rule. It
            will not become active until all required
            authorisations are completed.
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
                : "Submit for authorisation"}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}

type FormFieldProps = {
  label: string;
  name: keyof BeneficiaryFormData;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  placeholder: string;
  type?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "email"
    | "tel"
    | "decimal";
  maxLength?: number;
  required?: boolean;
};

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode = "text",
  maxLength,
  required = false,
}: FormFieldProps) {
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
        maxLength={maxLength}
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

export default CreateBeneficiaryPage;
