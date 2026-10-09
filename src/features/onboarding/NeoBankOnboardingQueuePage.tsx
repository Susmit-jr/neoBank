import {
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileSearch,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getNeoBankOnboardingQueue, createOnboardingDraft } from "../../services/onboardingService";
import type {
  AccountApplicationStatus,
  AccountOpeningApplication,
} from "../../types/onboarding";
import { formatDateTime } from "../../utils/dates";

import { useNavigate } from "react-router-dom";

type StatusFilter =
  | "ALL"
  | AccountApplicationStatus;

type SummaryCardType =
  | "TOTAL"
  | "PENDING"
  | "BANK"
  | "COMPLETED";

const statusOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All statuses",
    value: "ALL",
  },
  {
    label: "Submitted",
    value: "SUBMITTED",
  },
  {
    label: "Under NeoBank review",
    value: "UNDER_NEOBANK_REVIEW",
  },
  {
    label: "Additional information required",
    value: "ADDITIONAL_INFORMATION_REQUIRED",
  },
  {
    label: "Submitted to bank",
    value: "SUBMITTED_TO_BANK",
  },
  {
    label: "Under bank review",
    value: "UNDER_BANK_REVIEW",
  },
  {
    label: "Bank information required",
    value: "BANK_INFORMATION_REQUIRED",
  },
  {
    label: "Approved",
    value: "APPROVED",
  },
  {
    label: "Account opening in progress",
    value: "ACCOUNT_OPENING_IN_PROGRESS",
  },
  {
    label: "Account opened",
    value: "ACCOUNT_OPENED",
  },
  {
    label: "Account linked",
    value: "ACCOUNT_LINKED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
];

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function formatApplicationType(
  applicationType: AccountOpeningApplication["type"],
): string {
  if (applicationType === "OPEN_NEW_ACCOUNT") {
    return "New Account";
  }

  return "Existing Account Connection";
}

function getStatusStyle(
  status: AccountApplicationStatus,
): string {
  if (
    status === "ACCOUNT_OPENED" ||
    status === "ACCOUNT_LINKED" ||
    status === "APPROVED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "SUBMITTED" ||
    status === "UNDER_NEOBANK_REVIEW"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    status === "SUBMITTED_TO_BANK" ||
    status === "UNDER_BANK_REVIEW" ||
    status === "ACCOUNT_OPENING_IN_PROGRESS"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    status ===
      "ADDITIONAL_INFORMATION_REQUIRED" ||
    status === "BANK_INFORMATION_REQUIRED"
  ) {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "REJECTED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function NeoBankOnboardingQueuePage() {

  const navigate = useNavigate();
  const [applications, setApplications] = useState<AccountOpeningApplication[]>([]);

  const [isCreatingMerchant, setIsCreatingMerchant] = useState(false);


  const [selectedApplication, setSelectedApplication,] = useState<AccountOpeningApplication | null>(
      null,
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");


  async function handleOnboardMerchant() {
  setError("");
  setIsCreatingMerchant(true);

  try {
    const application =
      await createOnboardingDraft({
        applicationType: "OPEN_NEW_ACCOUNT",
      });

    navigate(
      `/platform-admin/onboarding/application/${application.id}`,
    );
  } catch (creationError) {
    setError(
      creationError instanceof Error
        ? creationError.message
        : "The merchant onboarding application could not be created.",
    );
  } finally {
    setIsCreatingMerchant(false);
  }
}



  async function loadApplications() {
    setError("");
    setIsLoading(true);

    try {
      const applicationData =
        await getNeoBankOnboardingQueue();

      setApplications(applicationData);

      setSelectedApplication(
        (currentApplication) => {
          if (!currentApplication) {
            return null;
          }

          return (
            applicationData.find(
              (application) =>
                application.id ===
                currentApplication.id,
            ) ?? null
          );
        },
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The account-onboarding queue could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      const searchableContent = [
        application.applicationReference,
        application.organisation.legalName,
        application.organisation.pan,
        application.organisation.gstin,
        application.applicant.fullName,
        application.applicant.workEmail,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(
          normalizedSearch,
        );

      return matchesStatus && matchesSearch;
    });
  }, [
    applications,
    searchTerm,
    statusFilter,
  ]);

  const pendingReviewCount =
    applications.filter(
      (application) =>
        application.status === "SUBMITTED" ||
        application.status ===
          "UNDER_NEOBANK_REVIEW",
    ).length;

  const submittedToBankCount =
    applications.filter(
      (application) =>
        application.status ===
          "SUBMITTED_TO_BANK" ||
        application.status ===
          "UNDER_BANK_REVIEW" ||
        application.status ===
          "ACCOUNT_OPENING_IN_PROGRESS",
    ).length;

  const completedCount =
    applications.filter(
      (application) =>
        application.status ===
          "ACCOUNT_OPENED" ||
        application.status ===
          "ACCOUNT_LINKED",
    ).length;

  function closeApplicationDetails() {
    setSelectedApplication(null);
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl">
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-slate-500"
            />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading account-opening applications...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Customer onboarding
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Account-opening applications
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Review submitted customer applications before
            forwarding them to the bank.
          </p>
        </div>

<div className="flex flex-col gap-3 sm:flex-row">
  <button
    type="button"
    onClick={() => void loadApplications()}
    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
  >
    <RefreshCw size={17} />
    Refresh queue
  </button>

<button
  type="button"
  onClick={() => void handleOnboardMerchant()}
  disabled={isCreatingMerchant}
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isCreatingMerchant ? (
    <RefreshCw
      size={17}
      className="animate-spin"
    />
  ) : (
    <Plus size={17} />
  )}

  {isCreatingMerchant
    ? "Creating application..."
    : "Onboard Merchant"}
</button>
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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total applications"
          value={String(applications.length)}
          type="TOTAL"
        />

        <SummaryCard
          label="Pending NeoBank review"
          value={String(pendingReviewCount)}
          type="PENDING"
        />

        <SummaryCard
          label="Submitted to bank"
          value={String(submittedToBankCount)}
          type="BANK"
        />

        <SummaryCard
          label="Completed"
          value={String(completedCount)}
          type="COMPLETED"
        />
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Application queue
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {filteredApplications.length} application(s)
              displayed
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as StatusFilter,
                );
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500"
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <label className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search applications"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 sm:w-72"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Application",
                  "Organisation",
                  "Applicant",
                  "Application type",
                  "Submitted on",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredApplications.map(
                (application) => (
                  <tr
                    key={application.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-xs font-semibold text-slate-900">
                        {
                          application.applicationReference
                        }
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="min-w-56">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            application.organisation
                              .legalName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          PAN:{" "}
                          {
                            application.organisation
                              .pan
                          }
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="min-w-48">
                        <p className="text-sm font-medium text-slate-900">
                          {
                            application.applicant
                              .fullName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            application.applicant
                              .workEmail
                          }
                        </p>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {formatApplicationType(
                        application.type,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {application.submittedAt
                        ? formatDateTime(
                            application.submittedAt,
                          )
                        : "Not submitted"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          application.status,
                        )}`}
                      >
                        {formatLabel(
                          application.status,
                        )}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplication(
                            application,
                          );
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={15} />
                        Review
                      </button>
                    </td>
                  </tr>
                ),
              )}

              {filteredApplications.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center"
                  >
                    <FileSearch
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-4 font-semibold text-slate-900">
                      No applications found
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      No submitted applications match the
                      selected filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {selectedApplication && (
        <>
          <button
            type="button"
            aria-label="Close application details"
            onClick={closeApplicationDetails}
            className="fixed inset-0 z-30 bg-slate-950/50"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  NeoBank review
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  {
                    selectedApplication.organisation
                      .legalName
                  }
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  {
                    selectedApplication.applicationReference
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={closeApplicationDetails}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close application details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <span
                className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                  selectedApplication.status,
                )}`}
              >
                {formatLabel(
                  selectedApplication.status,
                )}
              </span>

              <DetailSection title="Applicant">
                <DetailItem
                  label="Name"
                  value={
                    selectedApplication.applicant
                      .fullName
                  }
                />

                <DetailItem
                  label="Designation"
                  value={
                    selectedApplication.applicant
                      .designation
                  }
                />

                <DetailItem
                  label="Email"
                  value={
                    selectedApplication.applicant
                      .workEmail
                  }
                />

                <DetailItem
                  label="Mobile"
                  value={
                    selectedApplication.applicant
                      .mobileNumber
                  }
                />
              </DetailSection>

              <DetailSection title="Organisation">
                <DetailItem
                  label="Legal name"
                  value={
                    selectedApplication.organisation
                      .legalName
                  }
                />

                <DetailItem
                  label="Constitution"
                  value={formatLabel(
                    selectedApplication.organisation
                      .constitution,
                  )}
                />

                <DetailItem
                  label="PAN"
                  value={
                    selectedApplication.organisation
                      .pan
                  }
                />

                <DetailItem
                  label="GSTIN"
                  value={
                    selectedApplication.organisation
                      .gstin
                  }
                />

                <DetailItem
                  label="Nature of business"
                  value={
                    selectedApplication.organisation
                      .natureOfBusiness
                  }
                />

                <DetailItem
                  label="Registered address"
                  value={
                    selectedApplication.organisation
                      .registeredAddress
                  }
                />
              </DetailSection>

              <DetailSection title="Application summary">
                <DetailItem
                  label="Application type"
                  value={formatApplicationType(
                    selectedApplication.type,
                  )}
                />

                <DetailItem
                  label="Submitted on"
                  value={
                    selectedApplication.submittedAt
                      ? formatDateTime(
                          selectedApplication.submittedAt,
                        )
                      : "Not submitted"
                  }
                />

                <DetailItem
                  label="Authorised signatories"
                  value={String(
                    selectedApplication
                      .authorisedSignatories.length,
                  )}
                />

                <DetailItem
                  label="NeoBank users"
                  value={String(
                    selectedApplication
                      .proposedNeoBankUsers.length,
                  )}
                />

                <DetailItem
                  label="MOP rules"
                  value={String(
                    selectedApplication
                      .proposedMopRules.length,
                  )}
                />

                <DetailItem
                  label="Documents"
                  value={String(
                    selectedApplication.documents
                      .length,
                  )}
                />
              </DetailSection>

              <DetailSection title="Proposed users">
                <div className="space-y-3 sm:col-span-2">
                  {selectedApplication.proposedNeoBankUsers.map(
                    (proposedUser) => (
                      <div
                        key={proposedUser.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
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
                  )}
                </div>
              </DetailSection>

              <DetailSection title="Proposed MOP">
                <div className="space-y-3 sm:col-span-2">
                  {selectedApplication.proposedMopRules.map(
                    (rule) => (
                      <div
                        key={rule.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {formatLabel(
                            rule.operationType,
                          )}
                        </p>

                        {rule.stages.map((stage) => (
                          <p
                            key={stage.id}
                            className="mt-2 text-xs leading-5 text-slate-600"
                          >
                            Stage {stage.sequence}:{" "}
                            {stage.stageName},{" "}
                            {stage.requiredApprovals}{" "}
                            approval(s)
                          </p>
                        ))}
                      </div>
                    ),
                  )}
                </div>
              </DetailSection>

              <DetailSection title="Documents">
                <div className="space-y-3 sm:col-span-2">
                  {selectedApplication.documents.map(
                    (document) => (
                      <div
                        key={document.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {formatLabel(
                            document.documentType,
                          )}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {document.fileName}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </DetailSection>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                NeoBank review actions will be added in the
                next step. This screen currently provides a
                read-only application queue and review
                panel.
              </div>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  type: SummaryCardType;
};

function SummaryCard({
  label,
  value,
  type,
}: SummaryCardProps) {
  let Icon: LucideIcon = Building2;
  let iconStyle =
    "bg-slate-100 text-slate-700";

  if (type === "PENDING") {
    Icon = Clock3;
    iconStyle = "bg-amber-50 text-amber-700";
  }

  if (type === "BANK") {
    Icon = Landmark;
    iconStyle = "bg-blue-50 text-blue-700";
  }

  if (type === "COMPLETED") {
    Icon = CheckCircle2;
    iconStyle =
      "bg-emerald-50 text-emerald-700";
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
      >
        <Icon size={21} />
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

type DetailSectionProps = {
  title: string;
  children: ReactNode;
};

function DetailSection({
  title,
  children,
}: DetailSectionProps) {
  return (
    <section className="rounded-2xl bg-slate-50 p-5">
      <h4 className="mb-5 font-semibold text-slate-950">
        {title}
      </h4>

      <div className="grid gap-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({
  label,
  value,
}: DetailItemProps) {
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

export default NeoBankOnboardingQueuePage;
