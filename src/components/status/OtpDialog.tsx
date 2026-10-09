import { useState, type SubmitEvent } from "react";
import { LockKeyhole, X } from "lucide-react";

// shortcut: fixed demo OTP, replace with the real OTP service.
const DEMO_OTP = "123456";
const MAX_ATTEMPTS = 3;

type OtpDialogProps = {
  title: string;
  onVerified: () => void;
  onCancel: () => void;
};

function OtpDialog({ title, onVerified, onCancel }: OtpDialogProps) {
  const [otp, setOtp] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [notice, setNotice] = useState("");

  const locked = attempts >= MAX_ATTEMPTS;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (otp.trim() === DEMO_OTP) {
      onVerified();
      return;
    }

    const next = attempts + 1;
    setAttempts(next);
    setOtp("");
    setNotice(
      next >= MAX_ATTEMPTS
        ? "Too many incorrect attempts. Close this window and try again."
        : `Incorrect OTP. ${MAX_ATTEMPTS - next} attempt(s) remaining.`,
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Verify with OTP"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
        >
          <X size={18} />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
          <LockKeyhole size={22} />
        </span>

        <h2 className="mt-4 text-xl font-bold text-slate-950">
          Verify with OTP
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the 6-digit one-time password sent to your registered mobile
          number to {title}.
        </p>

        <input
          autoFocus
          inputMode="numeric"
          maxLength={6}
          value={otp}
          disabled={locked}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, ""));
            setNotice("");
          }}
          placeholder="Enter 6-digit OTP"
          className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)] disabled:bg-slate-50"
        />

        {notice && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={otp.length < 6 || locked}
          className="mt-5 w-full rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-50"
        >
          Verify and submit
        </button>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            Demo OTP: <strong className="text-slate-800">{DEMO_OTP}</strong>
          </span>
          <button
            type="button"
            onClick={() => setNotice("A new OTP has been sent.")}
            className="font-semibold text-[var(--brand-primary)]"
          >
            Resend OTP
          </button>
        </div>
      </form>
    </div>
  );
}

export default OtpDialog;
