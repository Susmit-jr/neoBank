import type { GeneratedMerchantCredential } from "../services/onboardingService";
export type AccountApplicationType =
  | "OPEN_NEW_ACCOUNT"
  | "CONNECT_EXISTING_ACCOUNT";

export type AccountApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_NEOBANK_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "SUBMITTED_TO_BANK"
  | "UNDER_BANK_REVIEW"
  | "BANK_INFORMATION_REQUIRED"
  | "APPROVED"
  | "ACCOUNT_OPENING_IN_PROGRESS"
  | "ACCOUNT_OPENED"
  | "ACCOUNT_LINKED"
  | "REJECTED";

export type OrganisationConstitution =
  | "SOLE_PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "LLP"
  | "PRIVATE_LIMITED_COMPANY"
  | "PUBLIC_LIMITED_COMPANY"
  | "TRUST"
  | "SOCIETY"
  | "ASSOCIATION";

export type RequestedAccountType =
  | "CURRENT_ACCOUNT"
  | "ESCROW_ACCOUNT"
  | "COLLECTION_ACCOUNT";

export type BankingService =
  | "CORPORATE_NET_BANKING"
  | "PAYMENTS"
  | "COLLECTIONS"
  | "VIRTUAL_ACCOUNTS"
  | "BULK_PAYMENTS"
  | "PAYROLL"
  | "TAX_PAYMENTS"
  | "API_BANKING";

export type SignatoryAuthority =
  | "ACCOUNT_OPENING"
  | "BANKING_TRANSACTIONS"
  | "BOTH";

export type NeoBankUserRole =
  | "CORPORATE_ADMIN"
  | "MAKER"
  | "CHECKER"
  | "VIEW_ONLY";

export type AccountApplicationApplicant = {
  fullName: string;
  workEmail: string;
  mobileNumber: string;
  designation: string;
};

export type AccountApplicationOrganisation = {
  legalName: string;
  constitution: OrganisationConstitution;

  pan: string;
  gstin: string;

  dateOfIncorporation: string;
  natureOfBusiness: string;

  registeredAddress: string;
};

export type NewAccountRequirement = {
  accountType: RequestedAccountType;
  preferredBranch: string;
  requestedServices: BankingService[];
};

export type ExistingAccountRequirement = {
  accountNumber: string;
  corporateId: string;
  accountName: string;
  ifscCode: string;
  requestedServices: BankingService[];
};

export type AuthorisedSignatory = {
  id: string;

  fullName: string;
  designation: string;

  email: string;
  mobileNumber: string;
  pan: string;

  authority: SignatoryAuthority;

  transactionLimit?: number;
};

export type ProposedNeoBankUser = {
  id: string;

  fullName: string;
  email: string;
  mobileNumber: string;

  role: NeoBankUserRole;

  linkedSignatoryId?: string;
};

export type OnboardingOperationType =
  | "BENEFICIARY_CREATION"
  | "BENEFICIARY_MODIFICATION"
  | "BENEFICIARY_DEACTIVATION"
  | "PAYMENT";

export type ProposedMopStage = {
  id: string;

  sequence: number;
  stageName: string;

  requiredApprovals: number;

  eligibleNeoBankUserIds: string[];
};

export type ProposedMopRule = {
  id: string;

  operationType: OnboardingOperationType;

  minimumAmount?: number;
  maximumAmount?: number;

  stages: ProposedMopStage[];
};

export type OnboardingDocumentType =
  | "PAN"
  | "GST_CERTIFICATE"
  | "INCORPORATION_DOCUMENT"
  | "BOARD_RESOLUTION"
  | "AUTHORISED_SIGNATORY_DOCUMENT";

export type OnboardingDocumentStatus =
  | "NOT_ADDED"
  | "ADDED"
  | "VERIFIED"
  | "REJECTED";

export type OnboardingDocument = {
  id: string;

  documentType: OnboardingDocumentType;
  fileName: string;

  status: OnboardingDocumentStatus;

  uploadedAt?: string;
  verifiedAt?: string;
  verificationRemarks?: string;

  isMockDocument: boolean;
};

export type NeoBankApplicationReview = {
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "INFORMATION_REQUIRED"
    | "COMPLETED";

  reviewedByUserId?: string;
  reviewedByName?: string;

  reviewStartedAt?: string;
  reviewCompletedAt?: string;

  remarks?: string;
};

export type BankApplicationReview = {
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "INFORMATION_REQUIRED"
    | "APPROVED"
    | "REJECTED";

  bankApplicationReference?: string;

  reviewedByUserId?: string;
  reviewedByName?: string;

  reviewStartedAt?: string;
  reviewCompletedAt?: string;

  remarks?: string;
  rejectionReason?: string;
};

export type OpenedAccountDetails = {
  bankAccountId: string;

  accountNumber: string;
  maskedAccountNumber: string;

  accountName: string;
  accountType: RequestedAccountType;

  corporateId: string;

  branchName: string;
  ifscCode: string;

  enabledServices: BankingService[];

  openedOrLinkedByUserId: string;
  openedOrLinkedByName: string;

  openedOrLinkedAt: string;
};

export type AccountOpeningApplication = {
  id: string;
  applicationReference: string;

  type: AccountApplicationType;
  status: AccountApplicationStatus;

  applicant: AccountApplicationApplicant;
  organisation: AccountApplicationOrganisation;

  newAccountRequirement?: NewAccountRequirement;
  existingAccountRequirement?: ExistingAccountRequirement;

  authorisedSignatories: AuthorisedSignatory[];
  proposedNeoBankUsers: ProposedNeoBankUser[];
  proposedMopRules: ProposedMopRule[];

  documents: OnboardingDocument[];

  declarationAccepted: boolean;
  declarationAcceptedAt?: string;

  createdAt: string;
  updatedAt: string;

  submittedAt?: string;
  submittedByUserId?: string;
  submittedByName?: string;

  neoBankReview: NeoBankApplicationReview;
  bankReview: BankApplicationReview;

  openedAccount?: OpenedAccountDetails;

  // Shown once to the applicant on the status page after the bank opens the account.
  issuedCredentials?: GeneratedMerchantCredential[];
};
