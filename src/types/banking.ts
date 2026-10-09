export type AccountStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type BankAccount = {
  id: string;
  organisationId: string;
  accountNumber: string;
  maskedAccountNumber: string;
  accountName: string;
  accountType: "CURRENT" | "SAVINGS" | "ESCROW";
  currency: "INR";
  bankName: string;
  branchName: string;
  ifscCode: string;
  availableBalance: number;
  ledgerBalance: number;
  status: AccountStatus;
  isPrimary: boolean;
};

export type TransactionType = "CREDIT" | "DEBIT";

export type TransactionStatus =
  | "SUCCESSFUL"
  | "PROCESSING"
  | "FAILED";

export type AccountTransaction = {
  id: string;
  accountId: string;
  transactionReference: string;
  transactionDate: string;
  valueDate: string;
  description: string;
  counterpartyName: string;
  type: TransactionType;
  amount: number;
  closingBalance: number;
  status: TransactionStatus;
};

export type BeneficiaryStatus =
  | "DRAFT"
  | "PENDING_AUTHORISATION"
  | "AUTHORISATION_IN_PROGRESS"
  | "AWAITING_NEXT_AUTHORISER"
  | "ACTIVE"
  | "REJECTED"
  | "RETURNED"
  | "AUTHORISATION_FAILED"
  | "AUTHORISATION_EXPIRED"
  | "CANCELLED"
  | "INACTIVE";

export type BeneficiaryAccountType =
  | "CURRENT"
  | "SAVINGS"
  | "CASH_CREDIT"
  | "OVERDRAFT";

export type Beneficiary = {
  id: string;
  organisationId: string;

  beneficiaryReference: string;
  beneficiaryCode: string;
  beneficiaryName: string;

  accountNumber: string;
  maskedAccountNumber: string;
  accountType: BeneficiaryAccountType;

  bankName: string;
  branchName: string;
  ifscCode: string;

  email?: string;
  mobileNumber?: string;

  status: BeneficiaryStatus;

  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  submittedAt?: string;

  appliedMopId?: string;
  appliedMopVersion?: number;

  currentApprovalStageSequence?: number;
  totalApprovalStages?: number;

  activatedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  lastPaymentDate?: string;
  totalPayments: number;
};
