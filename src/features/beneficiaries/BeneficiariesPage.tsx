import {
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { getBeneficiariesByOrganisation } from "../../services/beneficiaryService";
import { useAuth } from "../../store/AuthContext";
import { getMockDatabase } from "../../services/mockDatabase";

import type {
  Beneficiary,
  BeneficiaryStatus,
} from "../../types/banking";
import { formatDateTime } from "../../utils/dates";

type StatusFilter = "ALL" | BeneficiaryStatus;

const statusOptions: {
  label: string;
  value: StatusFilter;
}[] = [
  {
    label: "All statuses",
    value: "ALL",
  },
  {
    label: "Active",
    value: "ACTIVE",
  },
  {
    label: "Pending authorisation",
    value: "PENDING_AUTHORISATION",
  },
  {
    label: "Authorisation in progress",
    value: "AUTHORISATION_IN_PROGRESS",
  },
  {
    label: "Awaiting next authoriser",
    value: "AWAITING_NEXT_AUTHORISER",
  },
  {
    label: "Returned",
    value: "RETURNED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
  {
    label: "Inactive",
    value: "INACTIVE",
  },
];

function formatStatus(status: BeneficiaryStatus) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: BeneficiaryStatus) {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING_AUTHORISATION") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "AUTHORISATION_IN_PROGRESS") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "AWAITING_NEXT_AUTHORISER") {
    return "bg-violet-50 text-violet-700";
  }

  if (
    status === "REJECTED" ||
    status === "AUTHORISATION_FAILED"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (status === "RETURNED") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-slate-100 text-slate-700";
}

function BeneficiariesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [beneficiaries, setBeneficiaries] = useState<
    Beneficiary[]
  >([]);

  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<Beneficiary | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const canAddBeneficiary =
    user?.role === "MAKER" ||
    user?.role === "CORPORATE_ADMIN";

  async function loadBeneficiaries() {
    if (!user?.organisationId) {
      setError(
        "The current user is not mapped to an organisation.",
      );
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const beneficiaryData =
        await getBeneficiariesByOrganisation(
          user.organisationId,
        );

      setBeneficiaries(beneficiaryData);
    } catch {
      setError(
        "Beneficiary information could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBeneficiaries();
  }, [user?.organisationId]);

  const filteredBeneficiaries = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return beneficiaries.filter((beneficiary) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        beneficiary.status === statusFilter;

      const searchableContent = [
        beneficiary.beneficiaryName,
        beneficiary.beneficiaryCode,
        beneficiary.beneficiaryReference,
        beneficiary.maskedAccountNumber,
        beneficiary.bankName,
        beneficiary.ifscCode,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [beneficiaries, searchTerm, statusFilter]);

  const activeBeneficiaryCount = beneficiaries.filter(
    (beneficiary) => beneficiary.status === "ACTIVE",
  ).length;

  const pendingAuthorisationCount =
    beneficiaries.filter(
      (beneficiary) =>
        beneficiary.status ===
          "PENDING_AUTHORISATION" ||
        beneficiary.status ===
          "AUTHORISATION_IN_PROGRESS" ||
        beneficiary.status ===
          "AWAITING_NEXT_AUTHORISER",
    ).length;

  const inactiveBeneficiaryCount = beneficiaries.filter(
    (beneficiary) => beneficiary.status === "INACTIVE",
  ).length;
  function canCurrentUserTakeAction(
  beneficiaryId: string,
): boolean {
  if (!user?.id || !user.organisationId) {
    return false;
  }

  const database = getMockDatabase();

  const beneficiary = database.beneficiaries.find(
    (item) => item.id === beneficiaryId,
  );

  if (!beneficiary) {
    return false;
  }

  const actionableStatuses = [
    "PENDING_AUTHORISATION",
    "AUTHORISATION_IN_PROGRESS",
    "AWAITING_NEXT_AUTHORISER",
  ];

  if (
    !actionableStatuses.includes(beneficiary.status)
  ) {
    return false;
  }

  const currentStage = database.approvalStages
    .filter(
      (stage) =>
        stage.requestId === beneficiaryId &&
        stage.organisationId ===
          user.organisationId &&
        (stage.status === "PENDING" ||
          stage.status === "IN_PROGRESS"),
    )
    .sort(
      (first, second) =>
        first.stageSequence - second.stageSequence,
    )[0];

  if (!currentStage) {
    return false;
  }

  const userIsEligible =
    currentStage.eligibleUserIds.includes(user.id);

  if (!userIsEligible) {
    return false;
  }

  const userAlreadyActioned =
    database.approvalDecisions.some(
      (decision) =>
        decision.approvalRequestStageId ===
          currentStage.id &&
        decision.actionedByUserId === user.id,
    );

  return !userAlreadyActioned;
}
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl">
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw
              size={24}
              className="mx-auto animate-spin text-slate-500"
            />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading beneficiaries...
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
            Beneficiary management
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Beneficiaries
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            View beneficiary details and authorisation status.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadBeneficiaries()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          {canAddBeneficiary && (
            <button
              type="button"
              onClick={() => {
                    navigate("/merchant/beneficiaries/new");
                }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus size={17} />
              Add beneficiary
            </button>
          )}
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
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Users size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Total beneficiaries
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {beneficiaries.length}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Active
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {activeBeneficiaryCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Clock3 size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Pending authorisation
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {pendingAuthorisationCount}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Building2 size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Inactive
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {inactiveBeneficiaryCount}
          </p>
        </article>
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Beneficiary register
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {filteredBeneficiaries.length} records displayed
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
                placeholder="Search beneficiaries"
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
                  "Beneficiary",
                  "Account",
                  "Bank",
                  "Reference",
                  "Created by",
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
              {filteredBeneficiaries.map((beneficiary) => (
                <tr
                  key={beneficiary.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div className="min-w-52">
                      <p className="text-sm font-semibold text-slate-900">
                        {beneficiary.beneficiaryName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {beneficiary.beneficiaryCode}
                      </p>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {beneficiary.maskedAccountNumber}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {beneficiary.accountType.replaceAll(
                        "_",
                        " ",
                      )}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <div className="min-w-48">
                      <p className="text-sm font-medium text-slate-900">
                        {beneficiary.bankName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {beneficiary.ifscCode}
                      </p>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-600">
                    {beneficiary.beneficiaryReference}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="text-sm text-slate-700">
                      {beneficiary.createdByName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(beneficiary.createdAt)}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                        beneficiary.status,
                      )}`}
                    >
                      {formatStatus(beneficiary.status)}
                    </span>
                  </td>

<td className="whitespace-nowrap px-6 py-4">
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => {
        setSelectedBeneficiary(beneficiary);
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <Eye size={15} />
      View
    </button>

    {canCurrentUserTakeAction(beneficiary.id) && (
      <button
        type="button"
        onClick={() => {
          navigate(
            `/merchant/approvals?requestId=${beneficiary.id}`,
          );
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
      >
        <ShieldCheck size={15} />
        Take Action
      </button>
    )}
  </div>
</td>
                </tr>
              ))}

              {filteredBeneficiaries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No beneficiaries match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {selectedBeneficiary && (
        <>
          <button
            type="button"
            aria-label="Close beneficiary details"
            onClick={() => {
              setSelectedBeneficiary(null);
            }}
            className="fixed inset-0 z-30 bg-slate-950/40"
          />

          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Beneficiary details
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  {selectedBeneficiary.beneficiaryName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedBeneficiary(null);
                }}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <span
                className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                  selectedBeneficiary.status,
                )}`}
              >
                {formatStatus(selectedBeneficiary.status)}
              </span>

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                  <Building2 size={21} />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-950">
                  {selectedBeneficiary.bankName}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {selectedBeneficiary.branchName}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <DetailItem
                  label="Beneficiary code"
                  value={
                    selectedBeneficiary.beneficiaryCode
                  }
                />

                <DetailItem
                  label="Request reference"
                  value={
                    selectedBeneficiary.beneficiaryReference
                  }
                />

                <DetailItem
                  label="Account number"
                  value={
                    selectedBeneficiary.maskedAccountNumber
                  }
                />

                <DetailItem
                  label="Account type"
                  value={selectedBeneficiary.accountType.replaceAll(
                    "_",
                    " ",
                  )}
                />

                <DetailItem
                  label="IFSC"
                  value={selectedBeneficiary.ifscCode}
                />

                <DetailItem
                  label="Created by"
                  value={selectedBeneficiary.createdByName}
                />

                {selectedBeneficiary.status === "REJECTED" && (
  <>
    <DetailItem
      label="Rejected on"
      value={
        selectedBeneficiary.rejectedAt
          ? formatDateTime(
              selectedBeneficiary.rejectedAt,
            )
          : "Not available"
      }
    />

    <div className="sm:col-span-2">
      <p className="text-xs font-medium uppercase tracking-wide text-red-500">
        Rejection reason
      </p>

      <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-800">
        {selectedBeneficiary.rejectionReason ??
          "No rejection reason was recorded."}
      </p>
    </div>
  </>
)}

                <DetailItem
                  label="Created on"
                  value={formatDateTime(
                    selectedBeneficiary.createdAt,
                  )}
                />

                <DetailItem
                  label="Current MOP stage"
                  value={
                    selectedBeneficiary.currentApprovalStageSequence
                      ? `Stage ${selectedBeneficiary.currentApprovalStageSequence} of ${selectedBeneficiary.totalApprovalStages}`
                      : "Not applicable"
                  }
                />

                <DetailItem
                  label="Email"
                  value={
                    selectedBeneficiary.email ??
                    "Not provided"
                  }
                />

                <DetailItem
                  label="Mobile number"
                  value={
                    selectedBeneficiary.mobileNumber ??
                    "Not provided"
                  }
                />

                <DetailItem
                  label="Total payments"
                  value={String(
                    selectedBeneficiary.totalPayments,
                  )}
                />

                <DetailItem
                  label="Applied MOP version"
                  value={
                    selectedBeneficiary.appliedMopVersion
                      ? `Version ${selectedBeneficiary.appliedMopVersion}`
                      : "Not applicable"
                  }
                />
              </div>
            </div>
          </aside>
        </>
      )}
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default BeneficiariesPage;
