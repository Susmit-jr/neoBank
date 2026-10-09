import {
  ArrowRight,
  Building2,
  Landmark,
  Link2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOnboardingDraft } from "../../services/onboardingService";
import type { AccountApplicationType } from "../../types/onboarding";

type OnboardingOption = {
  type: AccountApplicationType;
  title: string;
  description: string;
  supportingText: string;
  icon: typeof Landmark;
  iconStyle: string;
};

const onboardingOptions: OnboardingOption[] = [
  {
    type: "OPEN_NEW_ACCOUNT",
    title: "Open a New Account",
    description:
      "Apply for a new corporate bank account through the NeoBank platform.",
    supportingText:
      "Provide organisation, signatory, user, MOP and basic document details.",
    icon: Landmark,
    iconStyle: "bg-blue-50 text-blue-700",
  },
  {
    type: "CONNECT_EXISTING_ACCOUNT",
    title: "Connect an Existing Account",
    description:
      "Connect an existing corporate bank account to the NeoBank platform.",
    supportingText:
      "Provide the existing account, corporate ID and requested-service details.",
    icon: Link2,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
];

type AccountOnboardingStartPageProps = {
  basePath?: string;
};

function AccountOnboardingStartPage({
  basePath = "/onboarding",
}: AccountOnboardingStartPageProps) {

  const navigate = useNavigate();

  const [selectedType, setSelectedType] =
    useState<AccountApplicationType | null>(null);

  const [isCreating, setIsCreating] =
    useState(false);

  const [error, setError] = useState("");

  async function startApplication(
    applicationType: AccountApplicationType,
  ) {
    setSelectedType(applicationType);
    setError("");
    setIsCreating(true);

    try {
      const application =
        await createOnboardingDraft({
          applicationType,
        });

navigate(
  `${basePath}/application/${application.id}`,
);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "The account-opening application could not be created.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Building2 size={23} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                NeoBank Platform
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-950">
                Corporate Account Onboarding
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            Return to portal selection
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Account onboarding
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Get started with business banking
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-600">
            Open a new corporate bank account or connect an
            existing account to access payments,
            beneficiaries, approvals and other NeoBank
            services.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {onboardingOptions.map((option) => {
            const Icon = option.icon;

            const isSelectedAndLoading =
              isCreating &&
              selectedType === option.type;

            return (
              <article
                key={option.type}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${option.iconStyle}`}
                >
                  <Icon size={26} />
                </div>

                <h2 className="mt-6 text-xl font-bold text-slate-950">
                  {option.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {option.description}
                </p>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-600"
                    />

                    <p className="text-sm leading-6 text-slate-600">
                      {option.supportingText}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() =>
                    void startApplication(option.type)
                  }
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSelectedAndLoading ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                      Creating application...
                    </>
                  ) : (
                    <>
                      Start application
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>

      </section>
    </main>
  );
}

export default AccountOnboardingStartPage;
