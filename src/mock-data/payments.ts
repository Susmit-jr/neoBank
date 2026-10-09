import type {
  Payment,
  PaymentProcessingEvent,
} from "../types/payment";

export const mockPayments: Payment[] = [
  {
    id: "PAY-001",
    organisationId: "ORG-001",

    paymentReference: "PAYREF-202609-001",
    paymentType: "VENDOR",
    paymentMode: "NEFT",
    priority: "NORMAL",

    debitAccountId: "ACC-001",
    debitAccountNumber: "001234567890",
    maskedDebitAccountNumber: "XXXXXX7890",
    debitAccountName:
      "Acme Enterprises Private Limited",

    beneficiaryId: "BEN-001",
    beneficiaryName: "Orbit Technologies LLP",
    beneficiaryAccountNumber: "002345678901",
    maskedBeneficiaryAccountNumber: "XXXXXX8901",
    beneficiaryBankName: "Horizon Bank",
    beneficiaryIfscCode: "HORI0000145",

    amount: 275000,
    currency: "INR",

    paymentPurpose: "Software services invoice",
    remarks: "September technology services",
    customerReference: "ACME-PAY-001",
    invoiceReference: "ORB-INV-0926",

    scheduledDate: "2026-09-22",

    status: "SUCCESSFUL",

    createdByUserId: "USR-MERCHANT-002",
    createdByName: "Neha Sharma",
    createdAt: "2026-09-22T10:15:00",
    submittedAt: "2026-09-22T10:20:00",

    appliedMopId: "MOP-ORG-001-PAY-001",
    appliedMopVersion: 1,
    currentApprovalStageSequence: 1,
    totalApprovalStages: 1,

    authorisedAt: "2026-09-22T11:30:00",
    processingStartedAt: "2026-09-22T11:32:00",
    completedAt: "2026-09-22T11:35:00",

    bankTransactionReference: "BANKTXN-220926-001",
    utrNumber: "UTR202609220018",
  },
  {
    id: "PAY-002",
    organisationId: "ORG-001",

    paymentReference: "PAYREF-202609-002",
    paymentType: "VENDOR",
    paymentMode: "RTGS",
    priority: "URGENT",

    debitAccountId: "ACC-001",
    debitAccountNumber: "001234567890",
    maskedDebitAccountNumber: "XXXXXX7890",
    debitAccountName:
      "Acme Enterprises Private Limited",

    beneficiaryId: "BEN-002",
    beneficiaryName: "Maharashtra Power Services",
    beneficiaryAccountNumber: "003456789012",
    maskedBeneficiaryAccountNumber: "XXXXXX9012",
    beneficiaryBankName:
      "National Commercial Bank",
    beneficiaryIfscCode: "NCBK0000278",

    amount: 1250000,
    currency: "INR",

    paymentPurpose: "Utility settlement",
    remarks: "Corporate utility payment",
    customerReference: "ACME-PAY-002",
    invoiceReference: "MPS-SEP-2026",

    scheduledDate: "2026-09-28",

    status: "PENDING_AUTHORISATION",

    createdByUserId: "USR-MERCHANT-002",
    createdByName: "Neha Sharma",
    createdAt: "2026-09-28T09:35:00",
    submittedAt: "2026-09-28T09:40:00",

    appliedMopId: "MOP-ORG-001-PAY-001",
    appliedMopVersion: 1,
    currentApprovalStageSequence: 1,
    totalApprovalStages: 1,
  },
  {
    id: "PAY-003",
    organisationId: "ORG-001",

    paymentReference: "PAYREF-202609-003",
    paymentType: "TAX",
    paymentMode: "NEFT",
    priority: "NORMAL",

    debitAccountId: "ACC-001",
    debitAccountNumber: "001234567890",
    maskedDebitAccountNumber: "XXXXXX7890",
    debitAccountName:
      "Acme Enterprises Private Limited",

    beneficiaryId: "BEN-002",
    beneficiaryName: "Government Tax Account",
    beneficiaryAccountNumber: "003456789012",
    maskedBeneficiaryAccountNumber: "XXXXXX9012",
    beneficiaryBankName:
      "National Commercial Bank",
    beneficiaryIfscCode: "NCBK0000278",

    amount: 320000,
    currency: "INR",

    paymentPurpose: "Statutory tax payment",
    remarks: "September statutory liability",
    customerReference: "ACME-TAX-SEP26",

    scheduledDate: "2026-09-20",

    status: "FAILED",

    createdByUserId: "USR-MERCHANT-002",
    createdByName: "Neha Sharma",
    createdAt: "2026-09-20T12:10:00",
    submittedAt: "2026-09-20T12:15:00",

    appliedMopId: "MOP-ORG-001-PAY-001",
    appliedMopVersion: 1,
    currentApprovalStageSequence: 1,
    totalApprovalStages: 1,

    authorisedAt: "2026-09-20T13:05:00",
    processingStartedAt: "2026-09-20T13:07:00",

    failedAt: "2026-09-20T13:10:00",
    failureReason:
      "Payment processing failed during bank validation.",
  },
];

export const mockPaymentProcessingEvents: PaymentProcessingEvent[] =
  [
    {
      id: "PAY-EVENT-001",
      paymentId: "PAY-001",
      paymentReference: "PAYREF-202609-001",
      status: "SUBMITTED_TO_BANK",
      eventTime: "2026-09-22T11:30:00",
    },
    {
      id: "PAY-EVENT-002",
      paymentId: "PAY-001",
      paymentReference: "PAYREF-202609-001",
      status: "VALIDATION_IN_PROGRESS",
      eventTime: "2026-09-22T11:31:00",
    },
    {
      id: "PAY-EVENT-003",
      paymentId: "PAY-001",
      paymentReference: "PAYREF-202609-001",
      status: "ACCEPTED",
      eventTime: "2026-09-22T11:32:00",
      bankTransactionReference:
        "BANKTXN-220926-001",
    },
    {
      id: "PAY-EVENT-004",
      paymentId: "PAY-001",
      paymentReference: "PAYREF-202609-001",
      status: "PROCESSING",
      eventTime: "2026-09-22T11:33:00",
      bankTransactionReference:
        "BANKTXN-220926-001",
    },
    {
      id: "PAY-EVENT-005",
      paymentId: "PAY-001",
      paymentReference: "PAYREF-202609-001",
      status: "SUCCESSFUL",
      eventTime: "2026-09-22T11:35:00",
      bankTransactionReference:
        "BANKTXN-220926-001",
      utrNumber: "UTR202609220018",
    },
    {
      id: "PAY-EVENT-006",
      paymentId: "PAY-003",
      paymentReference: "PAYREF-202609-003",
      status: "SUBMITTED_TO_BANK",
      eventTime: "2026-09-20T13:05:00",
    },
    {
      id: "PAY-EVENT-007",
      paymentId: "PAY-003",
      paymentReference: "PAYREF-202609-003",
      status: "VALIDATION_IN_PROGRESS",
      eventTime: "2026-09-20T13:07:00",
    },
    {
      id: "PAY-EVENT-008",
      paymentId: "PAY-003",
      paymentReference: "PAYREF-202609-003",
      status: "FAILED",
      eventTime: "2026-09-20T13:10:00",
      failureCode: "BANK_VALIDATION_FAILED",
      failureReason:
        "Payment processing failed during bank validation.",
    },
  ];
