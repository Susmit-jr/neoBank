import {
  CheckCircle2,
  Eye,
  EyeOff,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/dates";

import {
  useEffect,
  useState,
  type SubmitEvent,
} from "react";
import { useParams } from "react-router-dom";
import {
  approvePaymentThroughBank,
  approveThroughBank,
  authenticateBankUser,
  verifyBankOtp,
  getBankSessionDetails,
  type BankSessionDetails,
} from "../../services/authorisationService";

type PageStep =
  | "LOADING"
  | "LOGIN"
  | "OTP"
  | "REVIEW"
  | "SUCCESS"
  | "ERROR";

// Opened in the same tab (popup blocked or mobile) when there is no opener.
const returnUrl =
  new URLSearchParams(window.location.search).get(
    "return",
  ) ?? "/merchant/approvals";

function closeOrReturn() {
  if (window.opener) {
    window.close();
  } else {
    window.location.assign(returnUrl);
  }
}

function postResultToParent(
  status: string,
  message: string,
) {
  if (!window.opener) {
    return;
  }

  window.opener.postMessage(
    {
      source: "NEOBANK_BANK_AUTHORISATION",
      status,
      message,
    },
    window.location.origin,
  );
}

function BankAuthorisationPage() {
  const { sessionId } = useParams();

  const [details, setDetails] =
    useState<BankSessionDetails | null>(null);

  const [step, setStep] =
    useState<PageStep>("LOADING");

  const [corporateId, setCorporateId] =
    useState("");

  const [bankUserId, setBankUserId] =
    useState("");

  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

useEffect(() => {
  async function loadSession() {
    if (!sessionId) {
      setError(
        "The bank authorisation session is missing.",
      );
      setStep("ERROR");
      return;
    }

    try {
      const sessionDetails =
        await getBankSessionDetails(sessionId);

      if (
        sessionDetails.session.status === "APPROVED" ||
        sessionDetails.session.status === "REJECTED" ||
        sessionDetails.session.status === "FAILED" ||
        sessionDetails.session.status === "EXPIRED"
      ) {
        setError(
          "This bank authorisation session is no longer available.",
        );
        setStep("ERROR");
        return;
      }

      setDetails(sessionDetails);

      if (
        sessionDetails.session.status ===
        "AUTHENTICATED"
      ) {
        setStep("REVIEW");
        return;
      }

      setStep(
        sessionDetails.session.credentialsVerified
          ? "OTP"
          : "LOGIN",
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The bank session could not be loaded.",
      );

      setStep("ERROR");
    }
  }

  void loadSession();
}, [sessionId]);

useEffect(() => {
  const parentWindowCheck = window.setInterval(() => {
    if (window.opener?.closed) {
      window.clearInterval(parentWindowCheck);

      setError(
        "The NeoBank approval session is no longer available. Close this window and restart authorisation from the approval tray.",
      );

      setStep("ERROR");
    }
  }, 1000);

  return () => {
    window.clearInterval(parentWindowCheck);
  };
}, []);
  
useEffect(() => {
if (step !== "SUCCESS") {
return;
}
 
const closeTimer = window.setTimeout(() => {
closeOrReturn();
}, 3000);
 
return () => {
window.clearTimeout(closeTimer);
};
}, [step]);

  async function handleLogin(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!sessionId) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await authenticateBankUser({
        sessionId,
        corporateId,
        bankUserId,
        password,
      });

      setPassword("");
      setStep("OTP");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Bank authentication failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtp(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!sessionId) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await verifyBankOtp(sessionId, otp);
      setOtp("");
      setStep("REVIEW");
    } catch (otpError) {
      setError(
        otpError instanceof Error
          ? otpError.message
          : "The OTP could not be verified.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAuthorise() {
  if (!sessionId || !details) {
    return;
  }

  setError("");
  setIsSubmitting(true);

  try {
    if (details.requestType === "PAYMENT") {
      const result =
        await approvePaymentThroughBank(
          sessionId,
        );

      setSuccessMessage(result.message);
      setStep("SUCCESS");

      postResultToParent(
        result.payment.status,
        result.message,
      );

      return;
    }

    const result = await approveThroughBank(
      sessionId,
    );

    setSuccessMessage(result.message);
    setStep("SUCCESS");

    postResultToParent(
      result.beneficiary.status,
      result.message,
    );
  } catch (approvalError) {
    setError(
      approvalError instanceof Error
        ? approvalError.message
        : "Bank authorisation could not be completed.",
    );
  } finally {
    setIsSubmitting(false);
  }
}

  if (step === "LOADING") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-slate-700"
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading bank authorisation...
          </p>
        </div>
      </main>
    );
  }

  if (step === "ERROR" || !details) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <LockKeyhole size={27} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Authorisation unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-700">
            {error}
          </p>
          
          <button
            
            type="button"
            onClick={closeOrReturn}
            className="mt-7 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Return to NeoBank
          </button>
        </section>
      </main>
    );
  }

  if (step === "SUCCESS") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-950">
            Authorisation completed
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {successMessage}
          </p>

          <button
            type="button"
            onClick={closeOrReturn}
            className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
          >
            Return to NeoBank
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
      <section className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <header className="bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Landmark size={24} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Partner Bank
              </p>

              <h1 className="mt-1 text-lg font-bold">
                Corporate Authorisation
              </h1>
            </div>
          </div>
        </header>

        {step === "LOGIN" && (
          <form
            onSubmit={handleLogin}
            className="space-y-5 p-6 sm:p-8"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ShieldCheck size={24} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                Authenticate with the bank
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter your bank corporate net banking
                credentials to continue.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <BankInput
              label="Corporate ID"
              value={corporateId}
              onChange={setCorporateId}
              placeholder="Enter Corporate ID"
            />

            <BankInput
              label="Bank User ID"
              value={bankUserId}
              onChange={setBankUserId}
              placeholder="Enter Bank User ID"
            />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </span>

              <div className="relative">
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
                  placeholder="Enter bank password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              Authenticate
            </button>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
              Demo credentials for checker1:
              <br />
              Corporate ID: <strong>ACME001</strong>
              <br />
              Bank User ID:{" "}
              <strong>bankchecker01</strong>
              <br />
              Password:{" "}
              <strong>BankChecker@123</strong>
            </div>
          </form>
        )}

        {step === "OTP" && (
          <form
            onSubmit={handleOtp}
            className="space-y-5 p-6 sm:p-8"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <LockKeyhole size={24} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                Verify with OTP
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                A 6-digit one-time password has been
                sent to your registered mobile number.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <BankInput
              label="One-time password"
              value={otp}
              onChange={setOtp}
              placeholder="Enter 6-digit OTP"
            />

            <button
              type="submit"
              disabled={isSubmitting || otp.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              Verify and continue
            </button>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
              Demo OTP: <strong>123456</strong>
            </div>
          </form>
        )}

        {step === "REVIEW" && (
          <div className="p-6 sm:p-8">

                <h2 className="text-xl font-bold text-slate-950">
  {details.requestType === "PAYMENT"
    ? "Verify payment details"
    : "Verify beneficiary details"}
</h2>

            <p className="mt-2 text-sm text-slate-600">
              {details.requestType === "PAYMENT"
                ? "Review the payment before authorising."
                : "Review the beneficiary before authorising."}
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

              <div className="mt-6 grid gap-5 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
  {details.requestType ===
  "BENEFICIARY_CREATION" ? (
    <>
      <ReviewItem
        label="Beneficiary name"
        value={
          details.beneficiary
            .beneficiaryName
        }
      />

      <ReviewItem
        label="Request reference"
        value={
          details.beneficiary
            .beneficiaryReference
        }
      />

      <ReviewItem
        label="Account number"
        value={
          details.beneficiary
            .maskedAccountNumber
        }
      />

      <ReviewItem
        label="Account type"
        value={
          details.beneficiary.accountType.replaceAll(
            "_",
            " ",
          )
        }
      />

      <ReviewItem
        label="Bank"
        value={
          details.beneficiary.bankName
        }
      />

      <ReviewItem
        label="IFSC"
        value={
          details.beneficiary.ifscCode
        }
      />
    </>
  ) : (
    <>
      <ReviewItem
        label="Payment reference"
        value={
          details.payment.paymentReference
        }
      />

      <ReviewItem
        label="Payment amount"
        value={formatCurrency(
          details.payment.amount,
        )}
      />

      <ReviewItem
        label="Debit account"
        value={
          details.payment
            .maskedDebitAccountNumber
        }
      />

      <ReviewItem
        label="Beneficiary"
        value={
          details.payment.beneficiaryName
        }
      />

      <ReviewItem
        label="Beneficiary account"
        value={
          details.payment
            .maskedBeneficiaryAccountNumber
        }
      />

      <ReviewItem
        label="Beneficiary bank"
        value={
          details.payment
            .beneficiaryBankName
        }
      />

      <ReviewItem
        label="IFSC"
        value={
          details.payment
            .beneficiaryIfscCode
        }
      />

      <ReviewItem
        label="Payment mode"
        value={details.payment.paymentMode}
      />

      <ReviewItem
        label="Payment purpose"
        value={
          details.payment.paymentPurpose
        }
      />

      <ReviewItem
        label="Scheduled date"
        value={
          formatDate(details.payment.scheduledDate)
        }
      />
    </>
  )}

  <ReviewItem
    label="Current MOP stage"
    value={`${details.approvalStage.stageName} - Stage ${details.approvalStage.stageSequence}`}
  />

  <ReviewItem
    label="Required approvals"
    value={String(
      details.approvalStage
        .requiredApprovals,
    )}
  />
</div>

            <AuthorisersPanel
              authorisers={details.authorisers}
              required={
                details.approvalStage.requiredApprovals
              }
            />

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              By selecting Authorise, you confirm that the
              displayed {details.requestType === "PAYMENT" ? "payment" : "beneficiary"} details are correct.
            </div>

            <button
              type="button"
              onClick={() => void handleAuthorise()}
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={18} />
              )}

                {isSubmitting
  ? "Authorising..."
  : details.requestType === "PAYMENT"
    ? "Authorise transaction"
    : "Authorise beneficiary"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function AuthorisersPanel({
  authorisers,
  required,
}: {
  authorisers: BankSessionDetails["authorisers"];
  required: number;
}) {
  const approved = authorisers.filter(
    (item) => item.status === "APPROVED",
  ).length;
  const remainingAfterYou = Math.max(
    required - approved - 1,
    0,
  );
  const others = authorisers.filter(
    (item) => item.status === "PENDING",
  );

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-950">
        {remainingAfterYou === 0
          ? "Your authorisation completes this request."
          : `You are authorising this request. ${remainingAfterYou} more authorisation${remainingAfterYou > 1 ? "s" : ""} required after yours.`}
      </p>

      <ul className="mt-4 space-y-3">
        {authorisers.map((item) => (
          <li
            key={item.userId}
            className="flex items-center justify-between text-sm"
          >
            <span>
              <span className="font-semibold text-slate-900">
                {item.name}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                {item.role}
              </span>
            </span>

            <span
              className={
                item.status === "APPROVED"
                  ? "text-xs font-semibold text-emerald-700"
                  : item.status === "YOU"
                    ? "text-xs font-semibold text-blue-700"
                    : "text-xs font-semibold text-amber-700"
              }
            >
              {item.status === "APPROVED"
                ? "Authorised"
                : item.status === "YOU"
                  ? "You"
                  : "Pending"}
            </span>
          </li>
        ))}
      </ul>

      {remainingAfterYou > 0 && others.length > 0 && (
        <p className="mt-4 text-xs text-slate-500">
          Any {remainingAfterYou} of the pending
          authorisers can complete the remaining
          authorisation, in any order.
        </p>
      )}
    </div>
  );
}

type BankInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function BankInput({
  label,
  value,
  onChange,
  placeholder,
}: BankInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="text"
        required
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
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

export default BankAuthorisationPage;
