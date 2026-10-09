import type { Beneficiary } from "../types/banking";

export const mockBeneficiaries: Beneficiary[] = [
  {
    id: "BEN-001",
    organisationId: "ORG-001",

    beneficiaryReference: "BENREF-202609-001",
    beneficiaryCode: "ORBTECH",
    beneficiaryName: "Orbit Technologies LLP",

    accountNumber: "002345678901",
    maskedAccountNumber: "XXXXXX8901",
    accountType: "CURRENT",

    bankName: "Horizon Bank",
    branchName: "Bengaluru Corporate Branch",
    ifscCode: "HORI0000145",

    email: "accounts@orbit.demo",
    mobileNumber: "9876543210",

    status: "ACTIVE",

    createdByUserId: "USR-MERCHANT-002",
    createdByName: "Neha Sharma",
    createdAt: "2026-08-15T11:30:00",
    submittedAt: "2026-08-15T11:35:00",

    appliedMopId: "MOP-ORG-001-BEN-001",
    appliedMopVersion: 1,

    currentApprovalStageSequence: 1,
    totalApprovalStages: 1,

    activatedAt: "2026-08-15T16:10:00",
    lastPaymentDate: "2026-09-22T15:45:00",
    totalPayments: 18,
  },
  {
    id: "BEN-002",
    organisationId: "ORG-001",

    beneficiaryReference: "BENREF-202609-002",
    beneficiaryCode: "MAHAPOWER",
    beneficiaryName: "Maharashtra Power Services",

    accountNumber: "003456789012",
    maskedAccountNumber: "XXXXXX9012",
    accountType: "CURRENT",

    bankName: "National Commercial Bank",
    branchName: "Mumbai Central Branch",
    ifscCode: "NCBK0000278",

    email: "collections@mahapower.demo",

    status: "ACTIVE",

    createdByUserId: "USR-MERCHANT-002",
    createdByName: "Neha Sharma",
    createdAt: "2026-07-08T09:45:00",
    submittedAt: "2026-07-08T09:50:00",

    appliedMopId: "MOP-ORG-001-BEN-001",
    appliedMopVersion: 1,

    currentApprovalStageSequence: 1,
    totalApprovalStages: 1,

    activatedAt: "2026-07-08T15:30:00",
    lastPaymentDate: "2026-09-21T17:20:00",
    totalPayments: 11,
  },
  {
    id: "BEN-003",
    organisationId: "ORG-001",

    beneficiaryReference: "BENREF-202609-003",
    beneficiaryCode: "ZENLOG",
    beneficiaryName: "Zenith Logistics Private Limited",

    accountNumber: "004567890123",
    maskedAccountNumber: "XXXXXX0123",
    accountType: "CURRENT",

    bankName: "Unity Bank",
    branchName: "Pune Commercial Branch",
    ifscCode: "UNIT0000312",

    email: "finance@zenithlogistics.demo",
    mobileNumber: "9820012345",

    status: "PENDING_AUTHORISATION",

    createdByUserId: "USR-MERCHANT-002",
    createdByName: "Neha Sharma",
    createdAt: "2026-09-23T09:20:00",
    submittedAt: "2026-09-23T09:25:00",

    appliedMopId: "MOP-ORG-001-BEN-001",
    appliedMopVersion: 1,

    currentApprovalStageSequence: 1,
    totalApprovalStages: 1,

    totalPayments: 0,
  },
];
