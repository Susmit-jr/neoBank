import type { ReactNode } from "react";
import { Link } from "react-router-dom";

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-black text-white">
              X
            </span>
            <span className="text-lg font-black tracking-[0.18em]">
              X CORP
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
            <Link to="/track" className="hover:text-slate-950">
              Track application
            </Link>
            <Link
              to="/login/merchant"
              className="rounded-xl bg-slate-950 px-4 py-2 text-white hover:bg-slate-800"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}

export default PublicShell;
