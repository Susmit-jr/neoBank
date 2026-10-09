import { getMockDatabase } from "./mockDatabase";

const OPEN_STATUSES = [
  "PENDING_AUTHORISATION",
  "AUTHORISATION_IN_PROGRESS",
  "AWAITING_NEXT_AUTHORISER",
];

const FAILED_STATUSES = ["FAILED", "REJECTED", "AUTHORISATION_FAILED"];

export type DashboardSnapshot = {
  activeOrganisations: number;
  organisationsThisMonth: number;
  pendingAuthorisations: number;
  paymentsPendingAuthorisation: number;
  beneficiariesPendingAuthorisation: number;
  successfulPayments: number;
  successfulValue: number;
  inFlightPayments: number;
  failedPayments: number;
  successRate: number | null;
  activeBusinessUsers: number;
  openApplications: number;
  totalApplications: number;
  recentPayments: {
    id: string;
    reference: string;
    organisation: string;
    beneficiary: string;
    amount: number;
    status: string;
    at: string;
  }[];
  recentAuthorisations: {
    id: string;
    reference: string;
    action: string;
    by: string;
    at: string;
  }[];
  recentOnboardings: {
    id: string;
    organisation: string;
    corporateId: string;
    at: string;
  }[];
  paymentsByStatus: { status: string; count: number }[];
};

export function getDashboardSnapshot(): DashboardSnapshot {
  const database = getMockDatabase();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const organisationName = (organisationId: string) =>
    database.organisations.find((item) => item.id === organisationId)
      ?.legalName ?? "Unknown organisation";

  const payments = database.payments;
  const successful = payments.filter(
    (payment) => payment.status === "SUCCESSFUL",
  );
  const failed = payments.filter((payment) =>
    FAILED_STATUSES.includes(payment.status),
  );

  const paymentsPending = payments.filter((payment) =>
    OPEN_STATUSES.includes(payment.status),
  ).length;
  const beneficiariesPending = database.beneficiaries.filter(
    (beneficiary) => OPEN_STATUSES.includes(beneficiary.status),
  ).length;

  const finished = successful.length + failed.length;

  const statusCounts = new Map<string, number>();
  payments.forEach((payment) =>
    statusCounts.set(
      payment.status,
      (statusCounts.get(payment.status) ?? 0) + 1,
    ),
  );

  return {
    activeOrganisations: database.organisations.filter(
      (item) => item.status === "ACTIVE",
    ).length,
    organisationsThisMonth: database.organisations.filter(
      (item) => new Date(item.activatedAt) >= monthStart,
    ).length,
    pendingAuthorisations: paymentsPending + beneficiariesPending,
    paymentsPendingAuthorisation: paymentsPending,
    beneficiariesPendingAuthorisation: beneficiariesPending,
    successfulPayments: successful.length,
    successfulValue: successful.reduce(
      (total, payment) => total + payment.amount,
      0,
    ),
    inFlightPayments: payments.filter(
      (payment) =>
        payment.status === "AUTHORISED" ||
        payment.status === "PROCESSING",
    ).length,
    failedPayments: failed.length,
    successRate: finished
      ? Math.round((successful.length / finished) * 100)
      : null,
    activeBusinessUsers: database.users.filter(
      (user) => user.portal === "MERCHANT" && user.isActive,
    ).length,
    openApplications:
      database.accountOpeningApplications.filter(
        (item) =>
          item.status !== "ACCOUNT_OPENED" &&
          item.status !== "ACCOUNT_LINKED" &&
          item.status !== "REJECTED",
      ).length,
    totalApplications:
      database.accountOpeningApplications.length,
    recentPayments: [...payments]
      .sort(
        (first, second) =>
          new Date(second.submittedAt ?? second.createdAt).getTime() -
          new Date(first.submittedAt ?? first.createdAt).getTime(),
      )
      .slice(0, 6)
      .map((payment) => ({
        id: payment.id,
        reference: payment.paymentReference,
        organisation: organisationName(payment.organisationId),
        beneficiary: payment.beneficiaryName,
        amount: payment.amount,
        status: payment.status,
        at: payment.submittedAt ?? payment.createdAt,
      })),
    recentAuthorisations: [...database.approvalDecisions]
      .sort(
        (first, second) =>
          new Date(second.actionedAt).getTime() -
          new Date(first.actionedAt).getTime(),
      )
      .slice(0, 6)
      .map((decision) => ({
        id: decision.id,
        reference: decision.requestReference,
        action: decision.action,
        by: decision.actionedByName,
        at: decision.actionedAt,
      })),
    recentOnboardings: [...database.organisations]
      .sort(
        (first, second) =>
          new Date(second.activatedAt).getTime() -
          new Date(first.activatedAt).getTime(),
      )
      .slice(0, 5)
      .map((organisation) => ({
        id: organisation.id,
        organisation: organisation.legalName,
        corporateId: organisation.corporateId,
        at: organisation.activatedAt,
      })),
    paymentsByStatus: [...statusCounts.entries()].map(
      ([status, count]) => ({ status, count }),
    ),
  };
}
