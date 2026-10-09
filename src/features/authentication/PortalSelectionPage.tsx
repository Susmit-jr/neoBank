import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Landmark,
  LayoutDashboard,
  Send,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginPanel from "./LoginPanel";
import type { PortalType } from "../../types/auth";

const loginOptions = [
  {
    title: "Business Banking",
    description: "Accounts, payments and approvals for your company",
    portal: "MERCHANT",
    icon: Store,
  },
  {
    title: "NeoBank Admin",
    description: "X Corp onboarding and platform operations",
    portal: "PLATFORM_ADMIN",
    icon: Building2,
  },
  {
    title: "Bank Admin",
    description: "IndusInd Bank operations and oversight",
    portal: "BANK_ADMIN",
    icon: Landmark,
  },
] as const;

const features = [
  {
    icon: Wallet,
    title: "Accounts and balances",
    description:
      "Real-time view of every current account, balance and transaction in one place.",
  },
  {
    icon: Send,
    title: "Payments",
    description:
      "Send NEFT, RTGS and IMPS payments to saved beneficiaries with full reference tracking.",
  },
  {
    icon: Users,
    title: "Maker and checker control",
    description:
      "Every beneficiary and payment is authorised by the approvers your company nominates.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade authorisation",
    description:
      "Approvers confirm each transaction on a secure IndusInd Bank window with a one-time password.",
  },
] as const;

function PortalSelectionPage({
  openPortal = null,
}: {
  openPortal?: PortalType | null;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginPortal, setLoginPortal] =
    useState<PortalType | null>(openPortal);

  useEffect(() => {
    setLoginPortal(openPortal);
  }, [openPortal]);

  function closeLogin() {
    setLoginPortal(null);
    navigate("/", { replace: true });
  }
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () =>
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick,
      );
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-black text-white">
              X
            </div>
            <span className="text-lg font-black tracking-[0.18em]">
              X CORP
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-950">
              Features
            </a>
            <a href="#security" className="hover:text-slate-950">
              Security
            </a>
            <a href="#partner" className="hover:text-slate-950">
              Our banking partner
            </a>
          </nav>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Log in as
              <ChevronDown
                size={16}
                className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10"
              >
                {loginOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.title}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setLoginPortal(option.portal);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon size={19} />
                      </span>

                      <span>
                        <span className="block text-sm font-semibold text-slate-950">
                          {option.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
              <ShieldCheck size={14} />
              Banking partner: IndusInd Bank
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Business banking that moves as fast as you do.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Manage accounts, pay vendors and approve transactions
              with your team, on one secure platform built for growing
              companies.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/apply")}
                className="group flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-800"
              >
                Open a business account
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <button
                type="button"
                onClick={() => setLoginPortal("MERCHANT")}
                className="rounded-xl border border-slate-300 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Log in to Business Banking
              </button>

              <button
                type="button"
                onClick={() => navigate("/track")}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Track your application
              </button>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-slate-200 pt-8">
              <div>
                <dt className="text-xs text-slate-500">Payment modes</dt>
                <dd className="mt-1 text-lg font-bold">NEFT · RTGS · IMPS</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Approvals</dt>
                <dd className="mt-1 text-xl font-bold">Multi-checker</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Support</dt>
                <dd className="mt-1 text-xl font-bold">24 × 7</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-lg" aria-hidden="true">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <LayoutDashboard size={17} className="text-blue-700" />
                  Overview
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  All accounts active
                </span>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-950 p-6 text-white">
                <p className="text-xs text-slate-400">
                  Total available balance
                </p>
                <p className="mt-2 text-4xl font-bold tracking-tight">
                  ₹2.84 Cr
                </p>
                <div className="mt-6 flex h-14 items-end gap-1.5">
                  {[40, 55, 35, 65, 50, 75, 60, 85, 70, 95].map(
                    (height, index) => (
                      <span
                        key={index}
                        style={{ height: `${height}%` }}
                        className="flex-1 rounded-sm bg-blue-500/70"
                      />
                    ),
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Orbit Technologies LLP", "₹2,75,000", "Paid"],
                  ["Maharashtra Power Services", "₹12,50,000", "2 approvals left"],
                ].map(([name, amount, status]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-slate-500">{status}</p>
                    </div>
                    <p className="text-sm font-bold">{amount}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:-left-10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold">Payment authorised</p>
                <p className="text-xs text-slate-500">
                  Confirmed securely with IndusInd Bank
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <h2 className="max-w-2xl text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Everything your finance team needs, in one workspace.
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={21} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="security" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Every payment is approved the way your company decides.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-slate-300">
              Makers prepare payments. Your nominated checkers authorise
              them on a secure IndusInd Bank window, in any order, and
              only then is the payment sent.
            </p>
          </div>

          <ol className="space-y-4">
            {[
              "A maker adds a beneficiary or initiates a payment",
              "Checkers authorise through the bank's secure window with OTP",
              "The payment is sent once every required checker has approved",
            ].map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-slate-200">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="partner" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-800 text-white">
              <Landmark size={26} />
            </span>
            <div>
              <p className="text-lg font-bold">Banking partner: IndusInd Bank</p>
              <p className="mt-1 text-sm text-slate-600">
                Your accounts are held with IndusInd Bank. X Corp provides
                the platform.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/apply")}
            className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open a business account
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:px-8">
          <p>© 2026 X Corp. Banking services provided by IndusInd Bank.</p>
          <p>Privacy · Security · Support</p>
        </div>
      </footer>
      {loginPortal && (
        <LoginPanel
          key={loginPortal}
          portal={loginPortal}
          onClose={closeLogin}
        />
      )}
    </main>
  );
}

export default PortalSelectionPage;
