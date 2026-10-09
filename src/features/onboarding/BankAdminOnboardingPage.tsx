import {
  Building2,
  CheckCircle2,
  Eye,
  FileSearch,
  Landmark,
  RefreshCw,
  Search,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getBankAdminOnboardingRecords } from "../../services/onboardingService";
import type {
  AccountApplicationStatus,
  AccountOpeningApplication,
} from "../../types/onboarding";
import { formatDateTime } from "../../utils/dates";

type StatusFilter =
  | "ALL"
  | AccountApplicationStatus;

const statusOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All statuses",
    value: "ALL",
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

function getStatusStyle(
  status: AccountApplicationStatus,
): string {
  if (
    status === "ACCOUNT_OPENED" ||
    status === "ACCOUNT_LINKED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "APPROVED" ||
    status === "ACCOUNT_OPENING_IN_PROGRESS"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "REJECTED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatApplicationType(
  type: AccountOpeningApplication["type"],
): string {
  return type === "OPEN_NEW_ACCOUNT"
    ? "New Account"
    : "Existing Account Connection";
}

function formatCurrency(
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

function BankAdminOnboardingPage() {
  const [applications, setApplications] =
    useState<AccountOpeningApplication[]>([]);

  const [
    selectedApplication,
    setSelectedApplication,
  ] =
    useState<AccountOpeningApplication | null>(
      null,
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadApplications() {
    setError("");
    setIsLoading(true);

    try {
      const applicationData =
        await getBankAdminOnboardingRecords();

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
          : "Merchant onboarding records could not be loaded.",
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
        application.openedAccount?.accountNumber ?? "",
        application.openedAccount?.corporateId ?? "",
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

  const openedCount = applications.filter(
    (application) =>
      application.status === "ACCOUNT_OPENED",
  ).length;

  const linkedCount = applications.filter(
    (application) =>
      application.status === "ACCOUNT_LINKED",
  ).length;

  const totalUsers = applications.reduce(
    (total, application) =>
      total +
      application.proposedNeoBankUsers.length,
    0,
  );

  function closeDetails() {
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
              Loading merchant onboarding records...
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
            Merchant administration
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Merchant Onboarding
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            View merchant accounts created through the
            NeoBank Platform Admin onboarding process.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadApplications()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh records
        </button>
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
          label="Total merchants"
          value={String(applications.length)}
          icon={Building2}
          iconStyle="bg-slate-100 text-slate-700"
        />

        <SummaryCard
          label="Accounts opened"
          value={String(openedCount)}
          icon={CheckCircle2}
          iconStyle="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Accounts linked"
          value={String(linkedCount)}
          icon={Landmark}
          iconStyle="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          label="Configured users"
          value={String(totalUsers)}
          icon={Users}
          iconStyle="bg-violet-50 text-violet-700"
        />
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Onboarded merchants
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {filteredApplications.length} record(s)
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
                placeholder="Search merchants"
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
                  "Account",
                  "Corporate ID",
                  "Branch",
                  "Completed on",
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

                      <p className="mt-1 text-xs text-slate-500">
                        {formatApplicationType(
                          application.type,
                        )}
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

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {application.openedAccount
                          ?.maskedAccountNumber ??
                          "Not available"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {application.openedAccount
                          ?.accountType
                          ? formatLabel(
                              application.openedAccount
                                .accountType,
                            )
                          : "Account pending"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {application.openedAccount
                        ?.corporateId ??
                        "Not available"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="min-w-48">
                        <p className="text-sm font-medium text-slate-900">
                          {application.openedAccount
                            ?.branchName ??
                            "Not available"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {application.openedAccount
                            ?.ifscCode ??
                            ""}
                        </p>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {application.openedAccount
                        ?.openedOrLinkedAt
                        ? formatDateTime(
                            application.openedAccount
                              .openedOrLinkedAt,
                          )
                        : "Not available"}
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
                        View
                      </button>
                    </td>
                  </tr>
                ),
              )}

              {filteredApplications.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-14 text-center"
                  >
                    <FileSearch
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-4 font-semibold text-slate-900">
                      No merchant records found
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Completed NeoBank onboarding records
                      will appear here.
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
            aria-label="Close merchant details"
            onClick={closeDetails}
            className="fixed inset-0 z-30 bg-slate-950/50"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Bank Admin merchant record
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
                onClick={closeDetails}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close merchant details"
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

              <DetailSection title="Opened account">
                <DetailItem
                  label="Account number"
                  value={
                    selectedApplication.openedAccount
                      ?.maskedAccountNumber ??
                    "Not available"
                  }
                />

                <DetailItem
                  label="Account type"
                  value={
                    selectedApplication.openedAccount
                      ?.accountType
                      ? formatLabel(
                          selectedApplication
                            .openedAccount
                            .accountType,
                        )
                      : "Not available"
                  }
                />

                <DetailItem
                  label="Corporate ID"
                  value={
                    selectedApplication.openedAccount
                      ?.corporateId ??
                    "Not available"
                  }
                />

                <DetailItem
                  label="Branch"
                  value={
                    selectedApplication.openedAccount
                      ?.branchName ??
                    "Not available"
                  }
                />

                <DetailItem
                  label="IFSC"
                  value={
                    selectedApplication.openedAccount
                      ?.ifscCode ??
                    "Not available"
                  }
                />

                <DetailItem
                  label="Completed on"
                  value={
                    selectedApplication.openedAccount
                      ?.openedOrLinkedAt
                      ? formatDateTime(
                          selectedApplication
                            .openedAccount
                            .openedOrLinkedAt,
                        )
                      : "Not available"
                  }
                />

                <DetailItem
                  label="Completed by"
                  value={
                    selectedApplication.openedAccount
                      ?.openedOrLinkedByName ??
                    "Not available"
                  }
                />

                <DetailItem
                  label="Application type"
                  value={formatApplicationType(
                    selectedApplication.type,
                  )}
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
                  label="Date of incorporation"
                  value={
                    selectedApplication.organisation
                      .dateOfIncorporation
                  }
                />

                <DetailItem
                  label="Nature of business"
                  value={
                    selectedApplication.organisation
                      .natureOfBusiness
                  }
                />

                <div className="sm:col-span-2">
                  <DetailItem
                    label="Registered address"
                    value={
                      selectedApplication.organisation
                        .registeredAddress
                    }
                  />
                </div>
              </DetailSection>

              <DetailSection title="Enabled services">
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  {selectedApplication.openedAccount
                    ?.enabledServices.length ? (
                    selectedApplication.openedAccount.enabledServices.map(
                      (service) => (
                        <span
                          key={service}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                        >
                          {formatLabel(service)}
                        </span>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No services enabled.
                    </p>
                  )}
                </div>
              </DetailSection>

              <DetailSection title="Authorised signatories">
                <div className="space-y-3 sm:col-span-2">
                  {selectedApplication.authorisedSignatories.map(
                    (signatory) => (
                      <div
                        key={signatory.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm font-semibold text-slate-950">
                          {signatory.fullName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {signatory.designation}
                        </p>

                        <p className="mt-3 text-xs text-slate-600">
                          Authority:{" "}
                          {formatLabel(
                            signatory.authority,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Transaction limit:{" "}
                          {formatCurrency(
                            signatory.transactionLimit,
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </DetailSection>

              <DetailSection title="NeoBank users">
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

                        <span className="mt-3 inline-flex rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                          {formatLabel(
                            proposedUser.role,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </DetailSection>

              <DetailSection title="MOP configuration">
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
                          <div
                            key={stage.id}
                            className="mt-3 rounded-lg bg-slate-50 p-3"
                          >
                            <p className="text-xs font-semibold text-slate-800">
                              Stage {stage.sequence}:{" "}
                              {stage.stageName}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              Required approvals:{" "}
                              {stage.requiredApprovals}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              Eligible users:{" "}
                              {
                                stage
                                  .eligibleNeoBankUserIds
                                  .length
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    ),
                  )}
                </div>
              </DetailSection>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                This record is read from the same shared
                onboarding application created by the
                NeoBank Platform Admin. No separate Bank
                Admin copy has been created.
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
  icon: LucideIcon;
  iconStyle: string;
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconStyle,
}: SummaryCardProps) {
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

export default BankAdminOnboardingPage;
