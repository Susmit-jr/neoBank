import { useState, type SubmitEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { portalThemes } from "../../design-system/portalTheme";
import { useAuth } from "../../store/AuthContext";
import type { PortalType } from "../../types/auth";

type LoginPageProps = {
  portal: PortalType;
  portalName: string;
  description: string;
  usernameLabel?: string;
  demoUsername: string;
  demoPassword: string;
};

function LoginPage({
  portal,
  portalName,
  description,
  usernameLabel = "User ID",
  demoUsername,
  demoPassword,
}: LoginPageProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = portalThemes[portal];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUserId, setRememberUserId] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getDashboardRoute() {
    if (portal === "BANK_ADMIN") {
      return "/bank-admin/dashboard";
    }

    if (portal === "PLATFORM_ADMIN") {
      return "/platform-admin/dashboard";
    }

    return "/merchant/dashboard";
  }

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

      if (rememberUserId) {
        localStorage.setItem(
          `neobank_remembered_${portal}`,
          username,
        );
      } else {
        localStorage.removeItem(
          `neobank_remembered_${portal}`,
        );
      }

      navigate(getDashboardRoute());
    } catch {
      setError(
        "Unable to process the login request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function useDemoCredentials() {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <main
      data-portal={portal}
      className="flex min-h-screen items-center justify-center bg-[var(--app-canvas)] px-5 py-8 sm:px-8 sm:py-12"
    >
      <section className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-2xl shadow-slate-950/10 md:grid-cols-[1.05fr_1fr]">
        <aside className="relative flex min-h-[38rem] flex-col justify-between overflow-hidden bg-[var(--sidebar-surface)] p-8 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/10" />

          <div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Back to portal selection
            </button>

            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-black tracking-[-0.04em] text-[var(--brand-primary)]">
                {theme.brandMark}
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-[0.06em] text-white">
                  {theme.brand}
                </p>
                <p className="mt-1 text-xs text-white/50">{theme.workspace}</p>
              </div>
            </div>

            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
              <ShieldCheck size={22} />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Secure Access
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em]">
              {portalName}
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              {description}
            </p>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6">
            <p className="text-xs font-semibold text-white/70">
              {theme.securityLabel}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/40">
              Protected by role-based access and centrally governed security
              controls.
            </p>
          </div>
        </aside>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              <LockKeyhole size={23} />
            </div>

            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
              Sign in to continue
            </h2>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Enter your approved portal credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                {usernameLabel}
              </span>

              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder={`Enter ${usernameLabel.toLowerCase()}`}
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
                  name="password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
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

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={rememberUserId}
                  onChange={(event) =>
                    setRememberUserId(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-[var(--border-subtle)] accent-[var(--brand-primary)]"
                />

                Remember User ID
              </label>

              <button
                type="button"
                className="text-sm font-semibold text-[var(--brand-primary)] transition hover:text-[var(--brand-strong)]"
              >
                Forgot password?
              </button>
            </div>

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

          <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--brand-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              Demo credentials
            </p>

            <p className="mt-2 text-sm text-[var(--text-primary)]">
              User ID:{" "}
              <span className="font-semibold">
                {demoUsername}
              </span>
            </p>

            <p className="mt-1 text-sm text-[var(--text-primary)]">
              Password:{" "}
              <span className="font-semibold">
                {demoPassword}
              </span>
            </p>

            <button
              type="button"
              onClick={useDemoCredentials}
              className="mt-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:text-[var(--brand-strong)]"
            >
              Use demo credentials
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            Do not use actual banking credentials in this
            prototype.
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
