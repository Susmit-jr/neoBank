export type OperationType =
  | "BENEFICIARY_CREATION"
  | "BENEFICIARY_MODIFICATION"
  | "BENEFICIARY_DEACTIVATION"
  | "PAYMENT";

export type MopStatus = "ACTIVE" | "INACTIVE";

export type ApprovalStage = {
  id: string;
  sequence: number;
  stageName: string;
  requiredApprovals: number;
  eligibleUserIds: string[];
};

export type ModeOfOperation = {
  id: string;
  organisationId: string;
  mopReference: string;
  version: number;
  status: MopStatus;
  operationType: OperationType;
  stages: ApprovalStage[];
  effectiveFrom: string;
  effectiveTo?: string;
};

export type ApprovalStageStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "RETURNED"
  | "EXPIRED";

export type ApprovalRequestStage = {
  id: string;
  requestId: string;
  requestReference: string;
  organisationId: string;
  requestType: OperationType;

  mopId: string;
  mopVersion: number;

  stageId: string;
  stageSequence: number;
  stageName: string;

  requiredApprovals: number;
  eligibleUserIds: string[];

  status: ApprovalStageStatus;
  startedAt?: string;
  completedAt?: string;
};

export type ApprovalDecisionType =
  | "APPROVED"
  | "REJECTED"
  | "RETURNED";

export type ApprovalDecision = {
  id: string;
  approvalRequestStageId: string;
  requestId: string;
  requestReference: string;

  stageId: string;
  stageSequence: number;

  action: ApprovalDecisionType;

  actionedByUserId: string;
  actionedByName: string;
  actionedAt: string;

  remarks?: string;
  bankAuthorisationSessionId?: string;
};

export type BankAuthorisationSessionStatus =
  | "CREATED"
  | "AUTHENTICATED"
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "EXPIRED";

export type BankAuthorisationSession = {
  id: string;
  requestId: string;
  requestReference: string;
  requestType: OperationType;

  organisationId: string;
  platformUserId: string;

  approvalRequestStageId: string;
  stageSequence: number;

  status: BankAuthorisationSessionStatus;

  createdAt: string;
  expiresAt: string;
  completedAt?: string;
};

export type ApprovalTrayRequestType =
  | "BENEFICIARY"
  | "PAYMENT";

export type ApprovalTrayItem = {
  requestType: ApprovalTrayRequestType;

  requestId: string;
  requestReference: string;
  organisationId: string;

  title: string;
  subtitle: string;

  amount?: number;
  currency?: "INR";

  requestStatus: string;
  submittedAt: string;

  approvalStage: ApprovalRequestStage;
  decisions: ApprovalDecision[];
};
