import {
  ArrowRight,
  Building2,
  Landmark,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const portalOptions = [
  {
    portal: "BANK_ADMIN",
    eyebrow: "IndusInd Bank",
    title: "Bank Operations",
    description:
      "Govern merchant onboarding, authorisations, payment processing and operational exceptions.",
    route: "/login/bank-admin",
    icon: Landmark,
    action: "Enter Bank Admin",
  },
  {
    portal: "PLATFORM_ADMIN",
    eyebrow: "X CORP",
    title: "NeoBank Control",
    description:
      "Manage merchant provisioning, platform configuration, integrations and service health.",
    route: "/login/platform-admin",
    icon: Building2,
    action: "Enter NeoBank Admin",
  },
  {
    portal: "MERCHANT",
    eyebrow: "X CORP",
    title: "Business Banking",
    description:
      "Access accounts, beneficiaries, payments, approvals and corporate cash management.",
    route: "/login/merchant",
    icon: Store,
    action: "Enter Merchant Portal",
  },
] as const;

function PortalSelectionPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-5 py-8 text-slate-950 sm:px-8 sm:py-12">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-8 border-b border-slate-200 pb-9 lg:flex-row lg:items-end">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <ShieldCheck size={14} className="text-slate-950" />
              Secure digital banking gateway
            </div>

            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-950">
              X CORP
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              One platform. Every banking operation.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              A centrally governed workspace connecting bank operations,
              NeoBank administration and corporate treasury teams.
            </p>
          </div>

          <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-950">Sandbox environment</p>
            <p className="mt-1 leading-6">
              Select your authorized workspace. No real transactions are
              processed in this environment.
            </p>
          </div>
        </header>

        <div className="grid gap-5 py-8 md:grid-cols-3">
          {portalOptions.map((portal, index) => {
            const Icon = portal.icon;

            return (
              <article
                key={portal.title}
                data-portal={portal.portal}
                className="group flex min-h-[25rem] flex-col overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/10 sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
                    <Icon size={23} strokeWidth={1.8} />
                  </div>

                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    0{index + 1}
                  </span>
                </div>

                <div className="mt-12 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                    {portal.eyebrow}
                  </p>

                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                    {portal.title}
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                    {portal.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(portal.route)}
                  className="mt-8 flex w-full items-center justify-between rounded-xl bg-[var(--brand-primary)] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                >
                  {portal.action}
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </article>
            );
          })}
        </div>

        <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>Central access gateway · Governed by X Corp security controls</p>
          <p>Privacy · Security · Support</p>
        </footer>
      </section>
    </main>
  );
}

export default PortalSelectionPage;
