import {
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/dates";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SubmitEvent,
} from "react";
import { useParams } from "react-router-dom";
import IndusIndLogo from "../../components/branding/IndusIndLogo";
import { getMockDatabase } from "../../services/mockDatabase";
import {
  approveFundingThroughBank,
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
  | "EXPIRED"
  | "SUCCESS"
  | "ERROR";

// Opened in the same tab (popup blocked or mobile) when there is no opener.
const returnUrl =
  new URLSearchParams(window.location.search).get(
    "return",
  ) ?? "/merchant/approvals";

// Shown inside an overlay on the NeoBank page, or in a popup window, or alone in a tab.
const isEmbedded = window.parent !== window;
const parentWindow: Window | null = isEmbedded
  ? window.parent
  : window.opener;

function closeOrReturn() {
  if (isEmbedded) {
    window.parent.postMessage(
      { source: "NEOBANK_BANK_AUTHORISATION", type: "CLOSE" },
      window.location.origin,
    );
  } else if (window.opener) {
    window.close();
  } else {
    window.location.assign(returnUrl);
  }
}

function postResultToParent(
  status: string,
  message: string,
) {
  if (!parentWindow) {
    return;
  }

  parentWindow.postMessage(
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
  const [secondsLeft, setSecondsLeft] = useState(10);

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

      const finalStatus = sessionDetails.session.status;

      if (
        finalStatus === "APPROVED" ||
        finalStatus === "REJECTED" ||
        finalStatus === "FAILED" ||
        finalStatus === "EXPIRED"
      ) {
        if (finalStatus === "EXPIRED") {
          setStep("EXPIRED");
          return;
        }

        setError(
          finalStatus === "APPROVED"
            ? "This authorisation has already been completed. You can close this window."
            : finalStatus === "REJECTED"
              ? "This request has been rejected and is no longer available for authorisation."
              : "This bank authorisation session is no longer available.",
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
      if (
        loadError instanceof Error &&
        loadError.message.includes("expired")
      ) {
        setStep("EXPIRED");
        return;
      }

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
    if (!isEmbedded && window.opener?.closed) {
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

  const timer = window.setInterval(() => {
    setSecondsLeft((current) => current - 1);
  }, 1000);

  return () => window.clearInterval(timer);
}, [step]);

useEffect(() => {
  if (step === "SUCCESS" && secondsLeft <= 0) {
    closeOrReturn();
  }
}, [step, secondsLeft]);

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

  // The bank user who matches the NeoBank checker that started this session.
  const demoBankUser = details
    ? getMockDatabase().bankUsers.find(
        (item) =>
          item.platformUserId ===
          details.session.platformUserId,
      )
    : undefined;

  const expiresAt = details?.session.expiresAt;
  const [now, setNow] = useState(() => Date.now());
  const secondsRemaining = expiresAt
    ? Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - now) / 1000),
      )
    : null;

  useEffect(() => {
    if (!expiresAt || !["LOGIN", "OTP", "REVIEW"].includes(step)) {
      return;
    }

    const timer = window.setInterval(
      () => setNow(Date.now()),
      1000,
    );

    return () => window.clearInterval(timer);
  }, [expiresAt, step]);

  useEffect(() => {
    if (
      secondsRemaining === 0 &&
      sessionId &&
      ["LOGIN", "OTP", "REVIEW"].includes(step)
    ) {
      // Marks the session expired on the bank side as well.
      void getBankSessionDetails(sessionId).catch(() => undefined);
      setStep("EXPIRED");
    }
  }, [secondsRemaining, sessionId, step]);

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
    if (details.requestType === "ADD_BALANCE") {
      const result = await approveFundingThroughBank(sessionId);

      setSuccessMessage(result.message);
      setStep("SUCCESS");

      postResultToParent(result.funding.status, result.message);

      return;
    }

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

  const frameRef = useRef<HTMLElement>(null);

  // Tell the page that hosts this window how tall the content is, so it never scrolls.
  useEffect(() => {
    const element = frameRef.current;

    if (!isEmbedded || !element) {
      return;
    }

    const report = () =>
      window.parent.postMessage(
        {
          source: "NEOBANK_BANK_AUTHORISATION",
          type: "RESIZE",
          height: Math.ceil(element.getBoundingClientRect().height),
        },
        window.location.origin,
      );

    const observer = new ResizeObserver(report);
    observer.observe(element);
    report();

    return () => observer.disconnect();
  });

  const timer =
    secondsRemaining !== null &&
    ["LOGIN", "OTP", "REVIEW"].includes(step) ? (
      <p
        className={`text-xs font-semibold ${secondsRemaining <= 60 ? "text-[var(--brand-primary)]" : "text-slate-500"}`}
      >
        Session expires in{" "}
        <span className="text-sm">
          {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:
          {String(secondsRemaining % 60).padStart(2, "0")}
        </span>
      </p>
    ) : null;

  function frame(body: ReactNode) {
    return (
      <main
        ref={frameRef}
        data-portal="BANK_ADMIN"
        className={
          isEmbedded
            ? "bg-white"
            : "flex min-h-screen items-start justify-center bg-[var(--app-canvas)] p-6"
        }
      >
        <section
          className={
            isEmbedded
              ? "bg-white"
              : "w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
          }
        >
          <header className="flex items-center gap-4 border-b-4 border-[var(--brand-primary)] bg-white px-8 py-4 pr-16">
            <IndusIndLogo />
            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <h1 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Corporate Authorisation
            </h1>
            <div className="ml-auto">{timer}</div>
          </header>

          <div className="px-8 py-7">{body}</div>
        </section>
      </main>
    );
  }

  const errorBox = error ? (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      {error}
    </div>
  ) : null;

  function notice(
    icon: ReactNode,
    tone: string,
    title: string,
    text: ReactNode,
    action?: ReactNode,
  ) {
    return frame(
      <div className="mx-auto max-w-md py-4 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}
        >
          {icon}
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
        {action}
      </div>,
    );
  }

  const primaryButton =
    "flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-60";

  if (step === "LOADING") {
    return frame(
      <div className="py-10 text-center">
        <LoaderCircle className="mx-auto animate-spin text-[var(--brand-primary)]" />
        <p className="mt-4 text-sm font-medium text-slate-600">
          Loading bank authorisation...
        </p>
      </div>,
    );
  }

  if (step === "EXPIRED") {
    return notice(
      <Clock3 size={27} />,
      "bg-amber-50 text-amber-700",
      "Session expired",
      "For your security, a bank authorisation window stays open for 10 minutes. Nothing has been authorised. Return to NeoBank and select Authorise to start again.",
      <button
        type="button"
        onClick={closeOrReturn}
        className={`${primaryButton} mt-7`}
      >
        Return to NeoBank
      </button>,
    );
  }

  if (step === "ERROR" || !details) {
    return notice(
      <LockKeyhole size={27} />,
      "bg-red-50 text-red-700",
      "Authorisation unavailable",
      <span className="text-red-700">{error}</span>,
      <button
        type="button"
        onClick={closeOrReturn}
        className={`${primaryButton} mt-7`}
      >
        Return to NeoBank
      </button>,
    );
  }

  if (step === "SUCCESS") {
    return notice(
      <CheckCircle2 size={30} />,
      "bg-emerald-50 text-emerald-700",
      "Authorisation completed",
      <>
        {successMessage}
        <span className="mt-5 block text-slate-500">
          Returning to NeoBank in {Math.max(secondsLeft, 0)} second
          {secondsLeft === 1 ? "" : "s"}…
        </span>
      </>,
      <button
        type="button"
        onClick={closeOrReturn}
        className={`${primaryButton} mt-5`}
      >
        Return to NeoBank now
      </button>,
    );
  }

  const demoBox = (children: ReactNode) => (
    <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--brand-soft)] p-4 text-xs leading-5 text-[var(--text-primary)]">
      {children}
    </div>
  );

  if (step === "LOGIN") {
    return frame(
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
            <ShieldCheck size={24} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Authenticate with the bank
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter your bank corporate net banking credentials to
            continue.
          </p>

          {demoBankUser &&
            demoBox(
              <>
                <p className="font-semibold uppercase tracking-wide">
                  Demo credentials for {demoBankUser.fullName}
                </p>
                <p className="mt-2">
                  Corporate ID:{" "}
                  <strong>{demoBankUser.corporateId}</strong>
                  <br />
                  Bank User ID:{" "}
                  <strong>{demoBankUser.bankUserId}</strong>
                  <br />
                  Password: <strong>{demoBankUser.password}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCorporateId(demoBankUser.corporateId);
                    setBankUserId(demoBankUser.bankUserId);
                    setPassword(demoBankUser.password);
                    setError("");
                  }}
                  className="mt-3 rounded-lg border border-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)] hover:text-white"
                >
                  Use these credentials
                </button>
              </>,
            )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errorBox}

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
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                placeholder="Enter bank password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className={primaryButton}
          >
            {isSubmitting && (
              <LoaderCircle size={18} className="animate-spin" />
            )}
            Authenticate
          </button>
        </form>
      </div>,
    );
  }

  if (step === "OTP") {
    return frame(
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
            <LockKeyhole size={24} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Verify with OTP
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A 6-digit one-time password has been sent to your registered
            mobile number.
          </p>

          {demoBox(
            <>
              Demo OTP: <strong>123456</strong>
            </>,
          )}
        </div>

        <form onSubmit={handleOtp} className="space-y-4">
          {errorBox}

          <BankInput
            label="One-time password"
            value={otp}
            onChange={setOtp}
            placeholder="Enter 6-digit OTP"
          />

          <button
            type="submit"
            disabled={isSubmitting || otp.length < 6}
            className={primaryButton}
          >
            {isSubmitting && (
              <LoaderCircle size={18} className="animate-spin" />
            )}
            Verify and continue
          </button>
        </form>
      </div>,
    );
  }

  const isPayment = details.requestType === "PAYMENT";
  const subject =
    details.requestType === "ADD_BALANCE"
      ? "request"
      : isPayment
        ? "payment"
        : "beneficiary";

  const items: [string, string][] =
    details.requestType === "ADD_BALANCE"
      ? [
          ["Request reference", details.funding.fundingReference],
          ["Amount to add", formatCurrency(details.funding.amount)],
          ["Credit account", details.funding.maskedCreditAccountNumber],
          ["Add money from", details.funding.sourceAccountName],
          ["Source bank", details.funding.sourceBankName],
          [
            "Source account",
            details.funding.maskedSourceAccountNumber,
          ],
          ["Remarks", details.funding.remarks ?? "-"],
        ]
      : details.requestType === "BENEFICIARY_CREATION"
      ? [
          ["Beneficiary name", details.beneficiary.beneficiaryName],
          ["Request reference", details.beneficiary.beneficiaryReference],
          ["Account number", details.beneficiary.maskedAccountNumber],
          [
            "Account type",
            details.beneficiary.accountType.replaceAll("_", " "),
          ],
          ["Bank", details.beneficiary.bankName],
          ["IFSC", details.beneficiary.ifscCode],
        ]
      : [
          ["Payment reference", details.payment.paymentReference],
          ["Payment amount", formatCurrency(details.payment.amount)],
          ["Debit account", details.payment.maskedDebitAccountNumber],
          ["Beneficiary", details.payment.beneficiaryName],
          [
            "Beneficiary account",
            details.payment.maskedBeneficiaryAccountNumber,
          ],
          ["Beneficiary bank", details.payment.beneficiaryBankName],
          ["IFSC", details.payment.beneficiaryIfscCode],
          ["Payment mode", details.payment.paymentMode],
          ["Payment purpose", details.payment.paymentPurpose],
          ["Scheduled date", formatDate(details.payment.scheduledDate)],
        ];

  return frame(
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            {details.requestType === "ADD_BALANCE"
              ? "Verify add balance request"
              : isPayment
                ? "Verify payment details"
                : "Verify beneficiary details"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Review the {subject} before authorising.
          </p>
        </div>
      </div>

      {error && <div className="mt-4">{errorBox}</div>}

      <div className="mt-5 grid gap-x-6 gap-y-4 rounded-2xl bg-slate-50 p-5 grid-cols-2 sm:grid-cols-4">
        {items.map(([label, value]) => (
          <ReviewItem key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <AuthorisersPanel
          authorisers={details.authorisers}
          required={details.approvalStage.requiredApprovals}
        />

        <div className="flex flex-col justify-between gap-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            By selecting Authorise, you confirm that the displayed{" "}
            {subject} details are correct.
          </p>

          <button
            type="button"
            onClick={() => void handleAuthorise()}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {isSubmitting ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {isSubmitting
              ? "Authorising..."
              : details.requestType === "ADD_BALANCE"
                ? "Authorise add balance"
                : isPayment
                  ? "Authorise transaction"
                  : "Authorise beneficiary"}
          </button>
        </div>
      </div>
    </div>,
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
    <div className="rounded-2xl border border-slate-200 p-4">
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
                    ? "text-xs font-semibold text-[var(--brand-primary)]"
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
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
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
