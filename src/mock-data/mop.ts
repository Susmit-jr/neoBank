import type { ModeOfOperation } from "../types/approval";

export const mockModesOfOperation: ModeOfOperation[] = [
  {
    id: "MOP-ORG-001-BEN-001",
    organisationId: "ORG-001",
    mopReference: "MOP-BENEFICIARY-001",
    version: 1,
    status: "ACTIVE",
    operationType: "BENEFICIARY_CREATION",

    stages: [
      {
        id: "MOP-BEN-STAGE-001",
        sequence: 1,
        stageName: "Primary Authorisation",
        requiredApprovals: 1,
        eligibleUserIds: [
          "USR-MERCHANT-003",
          "USR-MERCHANT-004",
        ],
      },
    ],

    effectiveFrom: "2026-01-01",
  },

  {
    id: "MOP-ORG-001-BEN-MOD-001",
    organisationId: "ORG-001",
    mopReference: "MOP-BENEFICIARY-MODIFICATION-001",
    version: 1,
    status: "ACTIVE",
    operationType: "BENEFICIARY_MODIFICATION",

    stages: [
      {
        id: "MOP-BEN-MOD-STAGE-001",
        sequence: 1,
        stageName: "Beneficiary Modification Authorisation",
        requiredApprovals: 1,
        eligibleUserIds: [
          "USR-MERCHANT-003",
          "USR-MERCHANT-004",
        ],
      },
    ],

    effectiveFrom: "2026-01-01",
  },

  {
    id: "MOP-ORG-001-BEN-DEACT-001",
    organisationId: "ORG-001",
    mopReference: "MOP-BENEFICIARY-DEACTIVATION-001",
    version: 1,
    status: "ACTIVE",
    operationType: "BENEFICIARY_DEACTIVATION",

    stages: [
      {
        id: "MOP-BEN-DEACT-STAGE-001",
        sequence: 1,
        stageName: "Beneficiary Deactivation Authorisation",
        requiredApprovals: 1,
        eligibleUserIds: [
          "USR-MERCHANT-003",
          "USR-MERCHANT-004",
        ],
      },
    ],

    effectiveFrom: "2026-01-01",
  },

  {
    id: "MOP-ORG-001-PAY-001",
    organisationId: "ORG-001",
    mopReference: "MOP-PAYMENT-001",
    version: 1,
    status: "ACTIVE",
    operationType: "PAYMENT",

    stages: [
      {
        id: "MOP-PAY-STAGE-001",
        sequence: 1,
        stageName: "Payment Authorisation",
        requiredApprovals: 1,
        eligibleUserIds: [
          "USR-MERCHANT-003",
          "USR-MERCHANT-004",
        ],
      },
    ],

    effectiveFrom: "2026-01-01",
  },
];
