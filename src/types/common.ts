import type { ModeOfOperation } from "./approval";
import type { MockBankUser } from "../mock-data/bankUsers";
import type {
  ApprovalDecision,
  ApprovalRequestStage,
  BankAuthorisationSession,
} from "./approval";

import type { MerchantOrganisation,} from "./organisation";

import type {
  AccountTransaction,
  BankAccount,
  Beneficiary,
} from "./banking";

import type {
  Payment,
  PaymentProcessingEvent,
} from "./payment";

import type {
  AccountOpeningApplication,
} from "./onboarding";

import type { MockUser } from "./auth";

export type MockDatabase = {
  version: number;

  users: MockUser[];
  bankUsers: MockBankUser[];
  modesOfOperation: ModeOfOperation[];
  accounts: BankAccount[];
  transactions: AccountTransaction[];

  beneficiaries: Beneficiary[];

  payments: Payment[];
  paymentProcessingEvents: PaymentProcessingEvent[];

  approvalStages: ApprovalRequestStage[];
  approvalDecisions: ApprovalDecision[];
  bankAuthorisationSessions: BankAuthorisationSession[];

  accountOpeningApplications: AccountOpeningApplication[];

  organisations: MerchantOrganisation[];


};
