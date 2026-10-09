import {
  ArrowLeft,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";

function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function getDashboardRoute() {
    if (user?.portal === "BANK_ADMIN") {
      return "/bank-admin/dashboard";
    }

    if (user?.portal === "PLATFORM_ADMIN") {
      return "/platform-admin/dashboard";
    }

    if (user?.portal === "MERCHANT") {
      return "/merchant/dashboard";
    }

    return "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <ShieldAlert size={30} />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-red-700">
          Access restricted
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          You cannot access this page
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          This page does not exist, or your current portal and role
          do not have permission to access it.
        </p>

        {user && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-sm text-slate-600">
              Signed in as:{" "}
              <span className="font-semibold text-slate-900">
                {user.fullName}
              </span>
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Current role:{" "}
              <span className="font-semibold text-slate-900">
                {user.role}
              </span>
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {user && (
            <button
              type="button"
              onClick={() => navigate(getDashboardRoute())}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <LayoutDashboard size={17} />
              Return to dashboard
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Portal selection
          </button>
        </div>
      </section>
    </main>
  );
}

export default UnauthorizedPage;
