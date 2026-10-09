export type PaymentType =
  | "SINGLE"
  | "BULK"
  | "VENDOR"
  | "SALARY"
  | "TAX"
  | "SCHEDULED";

export type PaymentMode =
  | "IMPS"
  | "NEFT"
  | "RTGS";

export type PaymentStatus =
  | "DRAFT"
  | "PENDING_AUTHORISATION"
  | "AUTHORISATION_IN_PROGRESS"
  | "AWAITING_NEXT_AUTHORISER"
  | "AUTHORISED"
  | "PROCESSING"
  | "SUCCESSFUL"
  | "FAILED"
  | "REJECTED"
  | "RETURNED"
  | "AUTHORISATION_FAILED"
  | "AUTHORISATION_EXPIRED"
  | "CANCELLED";

export type PaymentPriority =
  | "NORMAL"
  | "URGENT";

export type Payment = {
  id: string;
  organisationId: string;

  paymentReference: string;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  priority: PaymentPriority;

  debitAccountId: string;
  debitAccountNumber: string;
  maskedDebitAccountNumber: string;
  debitAccountName: string;

  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryAccountNumber: string;
  maskedBeneficiaryAccountNumber: string;
  beneficiaryBankName: string;
  beneficiaryIfscCode: string;

  amount: number;
  currency: "INR";

  paymentPurpose: string;
  remarks?: string;
  customerReference?: string;
  invoiceReference?: string;

  scheduledDate: string;

  status: PaymentStatus;

  createdByUserId: string;
  createdByName: string;
  createdAt: string;

  submittedAt?: string;

  appliedMopId?: string;
  appliedMopVersion?: number;

  currentApprovalStageSequence?: number;
  totalApprovalStages?: number;

  authorisedAt?: string;
  processingStartedAt?: string;
  completedAt?: string;

  bankTransactionReference?: string;
  utrNumber?: string;

  rejectedAt?: string;
  rejectionReason?: string;

  returnedAt?: string;
  returnReason?: string;

  failedAt?: string;
  failureReason?: string;
};

export type CreatePaymentInput = {
  organisationId: string;

  paymentType: PaymentType;
  paymentMode: PaymentMode;
  priority: PaymentPriority;

  debitAccountId: string;
  beneficiaryId: string;

  amount: number;
  currency: "INR";

  paymentPurpose: string;
  remarks?: string;
  customerReference?: string;
  invoiceReference?: string;

  scheduledDate: string;

  createdByUserId: string;
  createdByName: string;
};

export type PaymentProcessingStatus =
  | "NOT_STARTED"
  | "SUBMITTED_TO_BANK"
  | "VALIDATION_IN_PROGRESS"
  | "ACCEPTED"
  | "PROCESSING"
  | "SUCCESSFUL"
  | "FAILED";

export type PaymentProcessingEvent = {
  id: string;
  paymentId: string;
  paymentReference: string;

  status: PaymentProcessingStatus;
  eventTime: string;

  bankTransactionReference?: string;
  utrNumber?: string;
  failureCode?: string;
  failureReason?: string;
};
