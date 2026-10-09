import { useEffect, useState, type SubmitEvent } from "react";
import { Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { portalThemes } from "../../design-system/portalTheme";
import { useAuth } from "../../store/AuthContext";
import type { PortalType } from "../../types/auth";

type DemoCredential = {
  label: string;
  username: string;
  password: string;
};

type PortalLoginConfig = {
  title: string;
  description: string;
  usernameLabel: string;
  demos: DemoCredential[];
  dashboardRoute: string;
};

const portalLoginConfig: Record<PortalType, PortalLoginConfig> = {
  BANK_ADMIN: {
    title: "Bank Admin",
    description:
      "Sign in to oversee merchant onboarding, authorisations and payment processing.",
    usernameLabel: "User ID",
    demos: [
      {
        label: "Bank Admin",
        username: "bankadmin",
        password: "Bank@123",
      },
    ],
    dashboardRoute: "/bank-admin/dashboard",
  },
  PLATFORM_ADMIN: {
    title: "NeoBank Admin",
    description:
      "Sign in to onboard businesses and manage the X Corp platform.",
    usernameLabel: "Platform User ID",
    demos: [
      {
        label: "NeoBank Admin",
        username: "platformadmin",
        password: "Platform@123",
      },
    ],
    dashboardRoute: "/platform-admin/dashboard",
  },
  MERCHANT: {
    title: "Business Banking",
    description:
      "Sign in to manage accounts, beneficiaries, payments and approvals.",
    usernameLabel: "Corporate User ID",
    demos: [
      {
        label: "Maker",
        username: "maker",
        password: "Maker@123",
      },
      {
        label: "Checker 1",
        username: "checker1",
        password: "Checker@123",
      },
      {
        label: "Checker 2",
        username: "checker2",
        password: "Checker@123",
      },
    ],
    dashboardRoute: "/merchant/dashboard",
  },
};

type LoginPanelProps = {
  portal: PortalType;
  onClose: () => void;
};

function LoginPanel({ portal, onClose }: LoginPanelProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = portalThemes[portal];
  const config = portalLoginConfig[portal];

  const [entered, setEntered] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setEntered(true),
    );

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () =>
      document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const result = await login({
        username,
        password,
        portal,
      });

      if (!result.success) {
        setError(result.message ?? "Login failed.");
        return;
      }

      navigate(config.dashboardRoute);
    } catch {
      setError(
        "Unable to process the login request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      data-portal={portal}
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label={`Sign in to ${config.title}`}
    >
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/50 transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto bg-[var(--surface-raised)] shadow-2xl transition-transform duration-300 md:w-1/2 md:min-w-[30rem] ${entered ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between bg-[var(--sidebar-surface)] px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black text-[var(--brand-primary)]">
              {theme.brandMark}
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[0.06em]">
                {theme.brand}
              </p>
              <p className="mt-0.5 text-xs text-white/60">
                {theme.workspace}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-auto w-full max-w-md flex-1 px-8 py-10">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            Sign in to {config.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {config.description}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                {config.usernameLabel}
              </span>

              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder={`Enter ${config.usernameLabel.toLowerCase()}`}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                Password
              </span>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-3 pr-12 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)]"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--brand-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              Demo credentials
            </p>

            <ul className="mt-3 space-y-2">
              {config.demos.map((demo) => (
                <li
                  key={demo.username}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
                >
                  <div className="text-sm text-[var(--text-primary)]">
                    <p className="font-semibold">{demo.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
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
      </aside>
    </div>
  );
}

export default LoginPanel;
