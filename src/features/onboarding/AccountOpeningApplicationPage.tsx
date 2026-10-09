import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Landmark,
  LoaderCircle,
  Save,
  Sparkles,
  Users,
  Copy,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  completeMerchantOnboarding,
  generateMockOnboardingValues,
  getOnboardingApplicationById,
  saveOnboardingDraft,
  validateOnboardingApplication,
  type GeneratedMerchantCredential,
} from "../../services/onboardingService";
import { useAuth } from "../../store/AuthContext";
import type {
  AccountOpeningApplication,
  BankingService,
} from "../../types/onboarding";

type PageMode =
  | "FORM"
  | "REVIEW"
  | "SUCCESS";

type AccountOpeningApplicationPageProps = {
  basePath?: string;
};

const bankingServiceOptions: {
  value: BankingService;
  label: string;
}[] = [
  {
    value: "CORPORATE_NET_BANKING",
    label: "Corporate Net Banking",
  },
  {
    value: "PAYMENTS",
    label: "Payments",
  },
  {
    value: "COLLECTIONS",
    label: "Collections",
  },
  {
    value: "VIRTUAL_ACCOUNTS",
    label: "Virtual Accounts",
  },
  {
    value: "BULK_PAYMENTS",
    label: "Bulk Payments",
  },
  {
    value: "PAYROLL",
    label: "Payroll",
  },
  {
    value: "TAX_PAYMENTS",
    label: "Tax Payments",
  },
  {
    value: "API_BANKING",
    label: "API Banking",
  },
];

const constitutionOptions = [
  "PRIVATE_LIMITED_COMPANY",
  "PUBLIC_LIMITED_COMPANY",
  "LLP",
  "PARTNERSHIP",
  "SOLE_PROPRIETORSHIP",
  "TRUST",
  "SOCIETY",
  "ASSOCIATION",
];

const accountTypeOptions = [
  "CURRENT_ACCOUNT",
  "ESCROW_ACCOUNT",
  "COLLECTION_ACCOUNT",
];

function formatApplicationType(
  type: AccountOpeningApplication["type"],
): string {
  return type === "OPEN_NEW_ACCOUNT"
    ? "Open a New Account"
    : "Connect an Existing Account";
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function formatDateTimeValue(
  value?: string,
): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrencyValue(
  amount?: number,
): string {
  if (amount === undefined) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function AccountOpeningApplicationPage({
  basePath = "/platform-admin/onboarding",
}: AccountOpeningApplicationPageProps) {
  const navigate = useNavigate();

  const { applicationId } = useParams<{
    applicationId: string;
  }>();

  const { user } = useAuth();

  const [application, setApplication] =
    useState<AccountOpeningApplication | null>(
      null,
    );

  const [pageMode, setPageMode] =
    useState<PageMode>("FORM");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isAutoFilling, setIsAutoFilling] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [validationErrors, setValidationErrors] =
    useState<string[]>([]);

  const [
  generatedCredentials,
  setGeneratedCredentials,
] = useState<GeneratedMerchantCredential[]>([]);

const [
  credentialsCopied,
  setCredentialsCopied,
] = useState(false);

  useEffect(() => {
    async function loadApplication() {
      if (!applicationId) {
        setError(
          "The application identifier is missing.",
        );

        setIsLoading(false);
        return;
      }

      try {
        const applicationData =
          await getOnboardingApplicationById(
            applicationId,
          );

        if (!applicationData) {
          setError(
            "The merchant onboarding application could not be found.",
          );

          return;
        }

        setApplication(applicationData);

        if (
          applicationData.status ===
            "ACCOUNT_OPENED" ||
          applicationData.status ===
            "ACCOUNT_LINKED"
        ) {
          setSuccessMessage(
            "Merchant onboarded successfully.",
          );

          setPageMode("SUCCESS");
        }
      } catch {
        setError(
          "The merchant onboarding application could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadApplication();
  }, [applicationId]);

  function clearMessages() {
    setError("");
    setSuccessMessage("");
    setValidationErrors([]);
  }

  function updateApplicantField(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setApplication((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        applicant: {
          ...current.applicant,
          [event.target.name]:
            event.target.value,
        },
      };
    });

    clearMessages();
  }

  function updateOrganisationField(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >,
  ) {
    setApplication((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        organisation: {
          ...current.organisation,
          [event.target.name]:
            event.target.value,
        },
      };
    });

    clearMessages();
  }

  function updateNewAccountField(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) {
    setApplication((current) => {
      if (!current?.newAccountRequirement) {
        return current;
      }

      return {
        ...current,
        newAccountRequirement: {
          ...current.newAccountRequirement,
          [event.target.name]:
            event.target.value,
        },
      };
    });

    clearMessages();
  }

  function toggleBankingService(
    service: BankingService,
  ) {
    setApplication((current) => {
      if (!current?.newAccountRequirement) {
        return current;
      }

      const existingServices =
        current.newAccountRequirement
          .requestedServices;

      const requestedServices =
        existingServices.includes(service)
          ? existingServices.filter(
              (item) => item !== service,
            )
          : [...existingServices, service];

      return {
        ...current,
        newAccountRequirement: {
          ...current.newAccountRequirement,
          requestedServices,
        },
      };
    });

    clearMessages();
  }

  function updateDeclaration(
    declarationAccepted: boolean,
  ) {
    setApplication((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        declarationAccepted,
        declarationAcceptedAt:
          declarationAccepted
            ? new Date().toISOString()
            : undefined,
      };
    });

    clearMessages();
  }

  async function handleAutoFill() {
    if (!application) {
      return;
    }

    clearMessages();
    setIsAutoFilling(true);

    try {
      const populatedApplication =
        generateMockOnboardingValues(
          application,
        );

      const savedApplication =
        await saveOnboardingDraft(
          populatedApplication,
        );

      setApplication(savedApplication);

      setSuccessMessage(
        "Mock values added successfully. Review the information before completing onboarding.",
      );
    } catch (autoFillError) {
      setError(
        autoFillError instanceof Error
          ? autoFillError.message
          : "Mock values could not be added.",
      );
    } finally {
      setIsAutoFilling(false);
    }
  }

  async function handleSaveDraft() {
    if (!application) {
      return;
    }

    clearMessages();
    setIsSaving(true);

    try {
      const savedApplication =
        await saveOnboardingDraft(application);

      setApplication(savedApplication);

      setSuccessMessage(
        "Draft saved successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The draft could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReviewApplication() {
    if (!application) {
      return;
    }

    clearMessages();
    setIsSaving(true);

    try {
      const savedApplication =
        await saveOnboardingDraft(application);

      setApplication(savedApplication);

      const validationResult =
        validateOnboardingApplication(
          savedApplication,
        );

      if (!validationResult.isValid) {
        setValidationErrors(
          validationResult.errors,
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      setPageMode("REVIEW");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "The application could not be prepared for review.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCompleteOnboarding() {
    if (!application) {
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const result =
        await completeMerchantOnboarding({
          applicationId: application.id,

          completedByUserId:
            user?.id ?? "USR-PLATFORM-001",

          completedByName:
            user?.fullName ??
            "Platform Administrator",
        });

setApplication(result.application);
setGeneratedCredentials(result.credentials);
setSuccessMessage(result.message);
setCredentialsCopied(false);
setPageMode("SUCCESS");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : "Merchant onboarding could not be completed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCredentials() {
  if (generatedCredentials.length === 0) {
    return;
  }

  const credentialText =
    generatedCredentials
      .map((credential) => {
        return [
          `Name: ${credential.fullName}`,
          `Role: ${formatLabel(credential.role)}`,
          `Username: ${credential.username}`,
          `Initial Password: ${credential.initialPassword}`,
        ].join("\n");
      })
      .join("\n\n");

  try {
    await navigator.clipboard.writeText(
      credentialText,
    );

    setCredentialsCopied(true);

    window.setTimeout(() => {
      setCredentialsCopied(false);
    }, 3000);
  } catch {
    setError(
      "The credentials could not be copied. Please copy them manually.",
    );
  }
}

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <LoaderCircle
            size={28}
            className="mx-auto animate-spin text-slate-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading merchant onboarding application...
          </p>
        </div>
      </main>
    );
  }

  if (error && !application) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle
            size={32}
            className="mx-auto text-red-700"
          />

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Application unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Return to Merchant Onboarding
          </button>
        </section>
      </main>
    );
  }

  if (!application) {
    return null;
  }

  if (pageMode === "SUCCESS") {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <section className="mx-auto max-w-3xl">
          <article className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={32} />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Onboarding completed
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              Merchant onboarded successfully.
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              The account has been opened and the same
              onboarding information is now available to
              the NeoBank Platform Admin and Bank Admin.
            </p>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-left">
              <ReviewDetail
                label="Application reference"
                value={
                  application.applicationReference
                }
              />

              <div className="mt-5">
                <ReviewDetail
                  label="Organisation"
                  value={
                    application.organisation.legalName
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Current status"
                  value={formatLabel(
                    application.status,
                  )}
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Account number"
                  value={
                    application.openedAccount
                      ?.maskedAccountNumber ??
                    "Not available"
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Corporate ID"
                  value={
                    application.openedAccount
                      ?.corporateId ??
                    "Not available"
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Account type"
                  value={
                    application.openedAccount
                      ?.accountType
                      ? formatLabel(
                          application.openedAccount
                            .accountType,
                        )
                      : "Not available"
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Branch"
                  value={
                    application.openedAccount
                      ?.branchName ??
                    "Not available"
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="IFSC"
                  value={
                    application.openedAccount
                      ?.ifscCode ??
                    "Not available"
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Enabled services"
                  value={
                    application.openedAccount
                      ?.enabledServices.length
                      ? application.openedAccount.enabledServices
                          .map(formatLabel)
                          .join(", ")
                      : "No services enabled"
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Proposed users"
                  value={String(
                    application
                      .proposedNeoBankUsers.length,
                  )}
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="MOP rules"
                  value={String(
                    application.proposedMopRules
                      .length,
                  )}
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Completed by"
                  value={
                    application.openedAccount
                      ?.openedOrLinkedByName ??
                    "Platform Administrator"
                  }
                />
              </div>

              <div className="mt-5">
                <ReviewDetail
                  label="Completed on"
                  value={formatDateTimeValue(
                    application.openedAccount
                      ?.openedOrLinkedAt,
                  )}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <p className="text-sm font-semibold text-blue-950">
        Merchant login credentials
      </p>

      <p className="mt-1 text-xs leading-5 text-blue-800">
        These are the initial credentials for the
        Merchant portal.
      </p>
    </div>

    {generatedCredentials.length > 0 && (
      <button
        type="button"
        onClick={() =>
          void handleCopyCredentials()
        }
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
      >
        {credentialsCopied ? (
          <CheckCircle2 size={17} />
        ) : (
          <Copy size={17} />
        )}

        {credentialsCopied
          ? "Credentials Copied"
          : "Copy Credentials"}
      </button>
    )}
  </div>

  {generatedCredentials.length > 0 ? (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {generatedCredentials.map(
        (credential) => (
          <article
            key={credential.userId}
            className="rounded-xl border border-blue-200 bg-white p-4"
          >
            <p className="font-semibold text-slate-950">
              {credential.fullName}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {credential.email}
            </p>

            <span className="mt-3 inline-flex rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
              {formatLabel(credential.role)}
            </span>

            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Username
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                  {credential.username}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Initial password
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                  {credential.initialPassword}
                </p>
              </div>
            </div>
          </article>
        ),
      )}
    </div>
  ) : (
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      Credentials are displayed only immediately after
      onboarding completion. The active users remain
      available in the merchant-user records.
    </div>
  )}
</div>

<div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900">
  These are prototype initial passwords. Share them only
  with the respective users. Bank Admin can view user
  identities and roles but should not be shown passwords.
</div>

            <button
              type="button"
              onClick={() => navigate(basePath)}
              className="mt-8 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Return to Merchant Onboarding
            </button>
          </article>
        </section>
      </main>
    );
  }

  if (pageMode === "REVIEW") {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6">
            <button
              type="button"
              onClick={() => {
                setPageMode("FORM");
                clearMessages();
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              <ArrowLeft size={17} />
              Edit application
            </button>

            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {formatLabel(application.status)}
            </span>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Merchant onboarding review
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              Review account-opening details
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              Verify the account, signatory, user and MOP
              information before completing onboarding.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <div className="space-y-6">
            <ReviewSection title="Application and applicant">
              <div className="grid gap-5 sm:grid-cols-2">
                <ReviewDetail
                  label="Application reference"
                  value={
                    application.applicationReference
                  }
                />

                <ReviewDetail
                  label="Application type"
                  value={formatApplicationType(
                    application.type,
                  )}
                />

                <ReviewDetail
                  label="Applicant"
                  value={
                    application.applicant.fullName
                  }
                />

                <ReviewDetail
                  label="Designation"
                  value={
                    application.applicant.designation
                  }
                />

                <ReviewDetail
                  label="Work email"
                  value={
                    application.applicant.workEmail
                  }
                />

                <ReviewDetail
                  label="Mobile number"
                  value={
                    application.applicant.mobileNumber
                  }
                />
              </div>
            </ReviewSection>

            <ReviewSection title="Organisation">
              <div className="grid gap-5 sm:grid-cols-2">
                <ReviewDetail
                  label="Legal name"
                  value={
                    application.organisation.legalName
                  }
                />

                <ReviewDetail
                  label="Constitution"
                  value={formatLabel(
                    application.organisation
                      .constitution,
                  )}
                />

                <ReviewDetail
                  label="PAN"
                  value={
                    application.organisation.pan
                  }
                />

                <ReviewDetail
                  label="GSTIN"
                  value={
                    application.organisation.gstin
                  }
                />

                <ReviewDetail
                  label="Date of incorporation"
                  value={
                    application.organisation
                      .dateOfIncorporation
                  }
                />

                <ReviewDetail
                  label="Nature of business"
                  value={
                    application.organisation
                      .natureOfBusiness
                  }
                />

                <div className="sm:col-span-2">
                  <ReviewDetail
                    label="Registered address"
                    value={
                      application.organisation
                        .registeredAddress
                    }
                  />
                </div>
              </div>
            </ReviewSection>

            <ReviewSection title="Account requirement">
              <div className="grid gap-5 sm:grid-cols-2">
                <ReviewDetail
                  label="Account type"
                  value={
                    application.newAccountRequirement
                      ?.accountType
                      ? formatLabel(
                          application
                            .newAccountRequirement
                            .accountType,
                        )
                      : "Not available"
                  }
                />

                <ReviewDetail
                  label="Preferred branch"
                  value={
                    application.newAccountRequirement
                      ?.preferredBranch ??
                    "Not available"
                  }
                />

                <div className="sm:col-span-2">
                  <ReviewDetail
                    label="Requested services"
                    value={
                      application.newAccountRequirement
                        ?.requestedServices.length
                        ? application.newAccountRequirement.requestedServices
                            .map(formatLabel)
                            .join(", ")
                        : "No services selected"
                    }
                  />
                </div>
              </div>
            </ReviewSection>

            <ReviewSection title="Authorised signatories">
              <div className="grid gap-4 lg:grid-cols-2">
                {application.authorisedSignatories.map(
                  (signatory) => (
                    <div
                      key={signatory.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <p className="font-semibold text-slate-950">
                        {signatory.fullName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {signatory.designation}
                      </p>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>{signatory.email}</p>
                        <p>{signatory.mobileNumber}</p>
                        <p>PAN: {signatory.pan}</p>

                        <p>
                          Authority:{" "}
                          {formatLabel(
                            signatory.authority,
                          )}
                        </p>

                        <p>
                          Transaction limit:{" "}
                          {formatCurrencyValue(
                            signatory.transactionLimit,
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </ReviewSection>

            <ReviewSection title="NeoBank users">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {application.proposedNeoBankUsers.map(
                  (proposedUser) => (
                    <div
                      key={proposedUser.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <p className="font-semibold text-slate-950">
                        {proposedUser.fullName}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {proposedUser.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {proposedUser.mobileNumber}
                      </p>

                      <span className="mt-4 inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        {formatLabel(
                          proposedUser.role,
                        )}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </ReviewSection>

            <ReviewSection title="Proposed MOP">
              <div className="space-y-4">
                {application.proposedMopRules.map(
                  (rule) => (
                    <div
                      key={rule.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <p className="font-semibold text-slate-950">
                        {formatLabel(
                          rule.operationType,
                        )}
                      </p>

                      {rule.minimumAmount !==
                        undefined && (
                        <p className="mt-2 text-sm text-slate-500">
                          Minimum amount:{" "}
                          {formatCurrencyValue(
                            rule.minimumAmount,
                          )}
                        </p>
                      )}

                      {rule.maximumAmount !==
                        undefined && (
                        <p className="mt-1 text-sm text-slate-500">
                          Maximum amount:{" "}
                          {formatCurrencyValue(
                            rule.maximumAmount,
                          )}
                        </p>
                      )}

                      <div className="mt-4 space-y-3">
                        {rule.stages.map(
                          (stage) => (
                            <div
                              key={stage.id}
                              className="rounded-xl bg-slate-50 p-4"
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                Stage{" "}
                                {stage.sequence}:{" "}
                                {stage.stageName}
                              </p>

                              <p className="mt-2 text-xs leading-5 text-slate-600">
                                Required approvals:{" "}
                                {
                                  stage.requiredApprovals
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                Eligible users:{" "}
                                {
                                  stage
                                    .eligibleNeoBankUserIds
                                    .length
                                }
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </ReviewSection>

            <ReviewSection title="Documents">
              <div className="grid gap-4 sm:grid-cols-2">
                {application.documents.map(
                  (document) => (
                    <div
                      key={document.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {formatLabel(
                          document.documentType,
                        )}
                      </p>

                      <p className="mt-2 break-all text-xs text-slate-500">
                        {document.fileName}
                      </p>

                      <span className="mt-3 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        {document.isMockDocument
                          ? "MOCK DOCUMENT"
                          : formatLabel(
                              document.status,
                            )}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </ReviewSection>

            <ReviewSection title="Declaration">
              <div
                className={`rounded-xl border p-4 text-sm ${
                  application.declarationAccepted
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {application.declarationAccepted
                  ? "Declaration accepted."
                  : "Declaration has not been accepted."}
              </div>
            </ReviewSection>
          </div>

          <div className="mt-8 flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setPageMode("FORM");
                clearMessages();
              }}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit application
            </button>

            <button
              type="button"
              onClick={() =>
                void handleCompleteOnboarding()
              }
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={18} />
              )}

              {isSubmitting
                ? "Completing onboarding..."
                : "Complete Onboarding"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const requestedServices =
    application.newAccountRequirement
      ?.requestedServices ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Merchant Onboarding
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                void handleAutoFill()
              }
              disabled={
                isAutoFilling ||
                application.status !== "DRAFT"
              }
              className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAutoFilling ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Sparkles size={17} />
              )}

              {isAutoFilling
                ? "Adding values..."
                : "Auto-fill Mock Values"}
            </button>

            <button
              type="button"
              onClick={() =>
                void handleSaveDraft()
              }
              disabled={
                isSaving ||
                application.status !== "DRAFT"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {isSaving
                ? "Saving..."
                : "Save Draft"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            New merchant account
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">
                Merchant onboarding
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Reference:{" "}
                <span className="font-semibold text-slate-900">
                  {application.applicationReference}
                </span>
              </p>
            </div>

            <span className="inline-flex w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {formatLabel(application.status)}
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div>
                <p className="text-sm font-semibold text-red-900">
                  Complete the following before review:
                </p>

                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-red-800">
                  {validationErrors.map(
                    (validationError) => (
                      <li key={validationError}>
                        {validationError}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          <FormSection
            icon={Users}
            title="Applicant details"
            description="Details of the individual initiating the merchant onboarding."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                label="Full name"
                name="fullName"
                value={
                  application.applicant.fullName
                }
                onChange={updateApplicantField}
              />

              <TextField
                label="Work email"
                name="workEmail"
                type="email"
                value={
                  application.applicant.workEmail
                }
                onChange={updateApplicantField}
              />

              <TextField
                label="Mobile number"
                name="mobileNumber"
                value={
                  application.applicant
                    .mobileNumber
                }
                onChange={updateApplicantField}
              />

              <TextField
                label="Designation"
                name="designation"
                value={
                  application.applicant.designation
                }
                onChange={updateApplicantField}
              />
            </div>
          </FormSection>

          <FormSection
            icon={FileText}
            title="Organisation profile"
            description="Basic organisation and registration information."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                label="Legal organisation name"
                name="legalName"
                value={
                  application.organisation.legalName
                }
                onChange={updateOrganisationField}
              />

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Constitution
                </span>

                <select
                  name="constitution"
                  value={
                    application.organisation
                      .constitution
                  }
                  onChange={updateOrganisationField}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
                >
                  {constitutionOptions.map(
                    (constitution) => (
                      <option
                        key={constitution}
                        value={constitution}
                      >
                        {formatLabel(
                          constitution,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <TextField
                label="PAN"
                name="pan"
                value={application.organisation.pan}
                onChange={updateOrganisationField}
              />

              <TextField
                label="GSTIN"
                name="gstin"
                value={
                  application.organisation.gstin
                }
                onChange={updateOrganisationField}
              />

              <TextField
                label="Date of incorporation"
                name="dateOfIncorporation"
                type="date"
                value={
                  application.organisation
                    .dateOfIncorporation
                }
                onChange={updateOrganisationField}
              />

              <TextField
                label="Nature of business"
                name="natureOfBusiness"
                value={
                  application.organisation
                    .natureOfBusiness
                }
                onChange={updateOrganisationField}
              />

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Registered address
                </span>

                <textarea
                  name="registeredAddress"
                  value={
                    application.organisation
                      .registeredAddress
                  }
                  onChange={updateOrganisationField}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            icon={Landmark}
            title="Account requirement"
            description="Select the required bank account and NeoBank services."
          >
            {application.newAccountRequirement ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Account type
                    </span>

                    <select
                      name="accountType"
                      value={
                        application
                          .newAccountRequirement
                          .accountType
                      }
                      onChange={
                        updateNewAccountField
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
                    >
                      {accountTypeOptions.map(
                        (accountType) => (
                          <option
                            key={accountType}
                            value={accountType}
                          >
                            {formatLabel(
                              accountType,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <TextField
                    label="Preferred branch"
                    name="preferredBranch"
                    value={
                      application
                        .newAccountRequirement
                        .preferredBranch
                    }
                    onChange={
                      updateNewAccountField
                    }
                  />
                </div>

                <div className="mt-7">
                  <p className="text-sm font-semibold text-slate-700">
                    Requested services
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {bankingServiceOptions.map(
                      (service) => (
                        <label
                          key={service.value}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={requestedServices.includes(
                              service.value,
                            )}
                            onChange={() =>
                              toggleBankingService(
                                service.value,
                              )
                            }
                            className="h-4 w-4"
                          />

                          <span className="text-sm font-medium text-slate-700">
                            {service.label}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState message="The new-account requirement is unavailable." />
            )}
          </FormSection>

          <FormSection
            icon={Users}
            title="Authorised signatories"
            description="Individuals authorised for account opening or banking transactions."
          >
            {application.authorisedSignatories
              .length === 0 ? (
              <EmptyState message="No authorised signatories added. Use Auto-fill Mock Values to populate sample records." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {application.authorisedSignatories.map(
                  (signatory) => (
                    <div
                      key={signatory.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <p className="font-semibold text-slate-950">
                        {signatory.fullName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {signatory.designation}
                      </p>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>{signatory.email}</p>
                        <p>{signatory.mobileNumber}</p>

                        <p>
                          Authority:{" "}
                          {formatLabel(
                            signatory.authority,
                          )}
                        </p>

                        <p>
                          Limit:{" "}
                          {formatCurrencyValue(
                            signatory.transactionLimit,
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </FormSection>

          <FormSection
            icon={Users}
            title="NeoBank users and MOP"
            description="Proposed Corporate Admin, Maker, Checker and approval configuration."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Proposed users
                </h3>

                <div className="mt-4 space-y-3">
                  {application.proposedNeoBankUsers
                    .length === 0 ? (
                    <EmptyState message="No NeoBank users added." />
                  ) : (
                    application.proposedNeoBankUsers.map(
                      (proposedUser) => (
                        <div
                          key={proposedUser.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <p className="text-sm font-semibold text-slate-950">
                            {proposedUser.fullName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {proposedUser.email}
                          </p>

                          <span className="mt-3 inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            {formatLabel(
                              proposedUser.role,
                            )}
                          </span>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  Proposed MOP rules
                </h3>

                <div className="mt-4 space-y-3">
                  {application.proposedMopRules
                    .length === 0 ? (
                    <EmptyState message="No MOP rules configured." />
                  ) : (
                    application.proposedMopRules.map(
                      (rule) => (
                        <div
                          key={rule.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <p className="text-sm font-semibold text-slate-950">
                            {formatLabel(
                              rule.operationType,
                            )}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            {rule.stages.length} approval
                            stage(s)
                          </p>

                          {rule.stages.map(
                            (stage) => (
                              <p
                                key={stage.id}
                                className="mt-2 text-xs text-slate-600"
                              >
                                Stage{" "}
                                {stage.sequence}:{" "}
                                {stage.stageName},{" "}
                                {
                                  stage.requiredApprovals
                                }{" "}
                                approval(s)
                              </p>
                            ),
                          )}
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={FileText}
            title="Documents and declaration"
            description="Mock document records used for the prototype journey."
          >
            {application.documents.length === 0 ? (
              <EmptyState message="No documents added. Auto-fill Mock Values will add sample document names." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {application.documents.map(
                  (document) => (
                    <div
                      key={document.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {formatLabel(
                          document.documentType,
                        )}
                      </p>

                      <p className="mt-2 break-all text-xs text-slate-500">
                        {document.fileName}
                      </p>

                      <span className="mt-3 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        Mock document
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}

            <label className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={
                  application.declarationAccepted
                }
                onChange={(event) =>
                  updateDeclaration(
                    event.target.checked,
                  )
                }
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm leading-6 text-slate-700">
                I confirm that the merchant information is
                correct and may be shared with the Bank
                Admin portal as part of this mock
                onboarding.
              </span>
            </label>
          </FormSection>
        </div>

        <div className="mt-8 flex flex-col justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              void handleSaveDraft()
            }
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <Save size={18} />
            )}

            {isSaving
              ? "Saving..."
              : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={() =>
              void handleReviewApplication()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <FileText size={18} />
            Review Application
          </button>
        </div>
      </section>
    </main>
  );
}

type FormSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
};

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-7 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </article>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  type?: string;
};

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      {message}
    </div>
  );
}

type ReviewSectionProps = {
  title: string;
  children: ReactNode;
};

function ReviewSection({
  title,
  children,
}: ReviewSectionProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-6 text-lg font-semibold text-slate-950">
        {title}
      </h2>

      {children}
    </article>
  );
}

type ReviewDetailProps = {
  label: string;
  value: string;
};

function ReviewDetail({
  label,
  value,
}: ReviewDetailProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default AccountOpeningApplicationPage;
