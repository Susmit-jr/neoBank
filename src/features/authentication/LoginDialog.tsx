import { useEffect, useState, type SubmitEvent } from "react";
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  Landmark,
  LoaderCircle,
  Store,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import IndusIndLogo from "../../components/branding/IndusIndLogo";
import { useAuth } from "../../store/AuthContext";
import type { PortalType } from "../../types/auth";

type DemoCredential = {
  label: string;
  username: string;
  password: string;
};

type PortalOption = {
  portal: PortalType;
  title: string;
  description: string;
  usernameLabel: string;
  dashboardRoute: string;
  demos: DemoCredential[];
  swatch: string;
  icon: typeof Store;
};

const options: PortalOption[] = [
  {
    portal: "MERCHANT",
    title: "Business Banking Portal",
    description: "Accounts, payments and approvals for your company",
    usernameLabel: "Corporate User ID",
    dashboardRoute: "/merchant/dashboard",
    swatch: "#1d4ed8",
    icon: Store,
    demos: [
      { label: "Maker", username: "maker", password: "Maker@123" },
      { label: "Checker 1", username: "checker1", password: "Checker@123" },
      { label: "Checker 2", username: "checker2", password: "Checker@123" },
    ],
  },
  {
    portal: "PLATFORM_ADMIN",
    title: "NeoBank Admin",
    description: "X Corp applications and platform activity",
    usernameLabel: "Platform User ID",
    dashboardRoute: "/platform-admin/dashboard",
    swatch: "#4338ca",
    icon: Building2,
    demos: [
      {
        label: "NeoBank Admin",
        username: "platformadmin",
        password: "Platform@123",
      },
    ],
  },
  {
    portal: "BANK_ADMIN",
    title: "Bank Admin",
    description: "IndusInd Bank approvals and oversight",
    usernameLabel: "User ID",
    dashboardRoute: "/bank-admin/dashboard",
    swatch: "#9c3238",
    icon: Landmark,
    demos: [
      { label: "Bank Admin", username: "bankadmin", password: "Bank@123" },
    ],
  },
];

type LoginDialogProps = {
  initialPortal: PortalType;
  onClose: () => void;
};

function LoginDialog({ initialPortal, onClose }: LoginDialogProps) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [group, setGroup] = useState<"BUSINESS" | "ADMIN">(
    initialPortal === "MERCHANT" ? "BUSINESS" : "ADMIN",
  );
  const [adminPortal, setAdminPortal] = useState<PortalType>(
    initialPortal === "BANK_ADMIN" ? "BANK_ADMIN" : "PLATFORM_ADMIN",
  );
  const portal: PortalType = group === "BUSINESS" ? "MERCHANT" : adminPortal;
  const [entered, setEntered] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = options.find((item) => item.portal === portal)!;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function reset() {
    setUsername("");
    setPassword("");
    setError("");
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login({ username, password, portal });

      if (!result.success) {
        setError(result.message ?? "Login failed.");
        return;
      }

      navigate(selected.dashboardRoute);
    } catch {
      setError("Unable to process the login request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      data-portal={portal}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Log in"
    >
      <button
        type="button"
        aria-label="Close log in"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`relative flex max-h-[96vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition duration-300 ${entered ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <div className="flex items-center justify-between bg-[var(--brand-primary)] px-7 py-5 text-white transition-colors duration-300">
          {portal === "BANK_ADMIN" ? (
            <div className="rounded-xl bg-white px-3 py-2">
              <IndusIndLogo className="h-6" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-black text-[var(--brand-primary)]">
                X
              </span>
              <span className="text-sm font-extrabold tracking-[0.18em]">
                X CORP
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-7 py-5">
          <fieldset>
            <legend className="text-2xl font-bold tracking-[-0.03em] text-slate-950">
              Log in as
            </legend>

            <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup">
              {(
                [
                  ["BUSINESS", "Business Banking", Store],
                  ["ADMIN", "Admin", Landmark],
                ] as const
              ).map(([value, label, Icon]) => {
                const active = group === value;

                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                      active
                        ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="login-as"
                      value={value}
                      checked={active}
                      onChange={() => {
                        setGroup(value);
                        reset();
                      }}
                      className="sr-only"
                    />

                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        active
                          ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {active && <Check size={13} strokeWidth={3} />}
                    </span>

                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Icon size={16} className="text-[var(--brand-primary)]" />
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>

            {group === "ADMIN" && (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Admin type
                </span>
                <select
                  value={adminPortal}
                  onChange={(event) => {
                    setAdminPortal(event.target.value as PortalType);
                    reset();
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                >
                  <option value="PLATFORM_ADMIN">NeoBank Admin</option>
                  <option value="BANK_ADMIN">Bank Admin</option>
                </select>
              </label>
            )}
          </fieldset>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                {selected.usernameLabel}
              </span>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={`Enter ${selected.usernameLabel.toLowerCase()}`}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </span>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:opacity-70"
            >
              {isSubmitting && (
                <LoaderCircle size={18} className="animate-spin" />
              )}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--brand-soft)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              Demo credentials
            </p>

            <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto pr-1">
              {selected.demos.map((demo) => (
                <li
                  key={demo.username}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
                >
                  <div className="text-sm text-slate-900">
                    <p className="font-semibold">{demo.label}</p>
                    <p className="text-xs text-slate-500">
                      {demo.username} / {demo.password}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUsername(demo.username);
                      setPassword(demo.password);
                      setError("");
                    }}
                    className="rounded-lg border border-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)] hover:text-white"
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginDialog;
