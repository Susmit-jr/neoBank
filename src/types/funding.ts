export type FundingStatus =
  | "PENDING_AUTHORISATION"
  | "AUTHORISATION_IN_PROGRESS"
  | "AWAITING_NEXT_AUTHORISER"
  | "AUTHORISED"
  | "PROCESSING"
  | "SUCCESSFUL"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED";

// A request to add money to a business account from a linked external account.
export type FundingRequest = {
  id: string;
  organisationId: string;
  fundingReference: string;

  creditAccountId: string;
  maskedCreditAccountNumber: string;
  creditAccountName: string;

  sourceAccountName: string;
  maskedSourceAccountNumber: string;
  sourceBankName: string;

  amount: number;
  currency: "INR";
  remarks?: string;

  status: FundingStatus;

  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  submittedAt: string;

  appliedMopId?: string;
  appliedMopVersion?: number;
  currentApprovalStageSequence?: number;
  totalApprovalStages?: number;

  authorisedAt?: string;
  processingStartedAt?: string;
  completedAt?: string;
  bankReference?: string;

  rejectedAt?: string;
  rejectionReason?: string;
};
