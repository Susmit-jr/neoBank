import type {
  ApprovalDecision,
  ApprovalRequestStage,
  ApprovalTrayItem,
  ModeOfOperation,
  OperationType,
} from "../types/approval";

import {
getMockDatabase,
updateMockDatabase,
} from "./mockDatabase";


export function createApprovalStagesFromMop(
  requestId: string,
  requestReference: string,
  organisationId: string,
  requestType: OperationType,
  mop: ModeOfOperation,
): ApprovalRequestStage[] {
  return mop.stages.map((stage) => ({
    id: crypto.randomUUID(),

    requestId,
    requestReference,
    organisationId,

    requestType,

    mopId: mop.id,
    mopVersion: mop.version,

    stageId: stage.id,
    stageSequence: stage.sequence,
    stageName: stage.stageName,

    requiredApprovals: stage.requiredApprovals,
    eligibleUserIds: [...stage.eligibleUserIds],

    status: "PENDING",
  }));
}

export function getCurrentApprovalStage(
  approvalStages: ApprovalRequestStage[],
): ApprovalRequestStage | undefined {
  return [...approvalStages]
    .filter(
      (stage) =>
        stage.status === "PENDING" ||
        stage.status === "IN_PROGRESS",
    )
    .sort(
      (first, second) =>
        first.stageSequence - second.stageSequence,
    )[0];
}

export function getStageDecisions(
  stage: ApprovalRequestStage,
  decisions: ApprovalDecision[],
): ApprovalDecision[] {
  return decisions.filter(
    (decision) =>
      decision.approvalRequestStageId === stage.id,
  );
}

export function getStageApprovalCount(
  stage: ApprovalRequestStage,
  decisions: ApprovalDecision[],
): number {
  return getStageDecisions(stage, decisions).filter(
    (decision) => decision.action === "APPROVED",
  ).length;
}

export function canUserAuthoriseStage(
  userId: string,
  stage: ApprovalRequestStage,
  decisions: ApprovalDecision[],
): boolean {
  const stageIsActionable =
    stage.status === "PENDING" ||
    stage.status === "IN_PROGRESS";

  const userIsEligible =
    stage.eligibleUserIds.includes(userId);

  const userAlreadyActed = getStageDecisions(
    stage,
    decisions,
  ).some(
    (decision) =>
      decision.actionedByUserId === userId,
  );

  return (
    stageIsActionable &&
    userIsEligible &&
    !userAlreadyActed
  );
}

export function isStageComplete(
  stage: ApprovalRequestStage,
  decisions: ApprovalDecision[],
): boolean {
  return (
    getStageApprovalCount(stage, decisions) >=
    stage.requiredApprovals
  );
}

export function areAllApprovalStagesComplete(
  stages: ApprovalRequestStage[],
): boolean {
  return (
    stages.length > 0 &&
    stages.every(
      (stage) => stage.status === "COMPLETED",
    )
  );
}

export type RejectBeneficiaryInput = {
  beneficiaryId: string;
  actionedByUserId: string;
  actionedByName: string;
  remarks: string;
};

export type RejectBeneficiaryResult = {
  beneficiaryId: string;
  beneficiaryReference: string;
  status: "REJECTED";
  message: string;
};

export async function rejectBeneficiaryRequest(
  input: RejectBeneficiaryInput,
): Promise<RejectBeneficiaryResult> {
  const remarks = input.remarks.trim();

  if (!remarks) {
    throw new Error(
      "Rejection remarks are mandatory.",
    );
  }

  const database = getMockDatabase();

  const beneficiary = database.beneficiaries.find(
    (item) => item.id === input.beneficiaryId,
  );

  if (!beneficiary) {
    throw new Error(
      "The beneficiary request could not be found.",
    );
  }

  if (
    beneficiary.status !== "PENDING_AUTHORISATION" &&
    beneficiary.status !== "AUTHORISATION_IN_PROGRESS" &&
    beneficiary.status !== "AWAITING_NEXT_AUTHORISER"
  ) {
    throw new Error(
      "This beneficiary request is not available for rejection.",
    );
  }

  if (
    beneficiary.createdByUserId ===
    input.actionedByUserId
  ) {
    throw new Error(
      "The Maker cannot reject their own beneficiary request.",
    );
  }

  const currentStage = database.approvalStages
    .filter(
      (stage) =>
        stage.requestId === input.beneficiaryId &&
        (stage.status === "PENDING" ||
          stage.status === "IN_PROGRESS"),
    )
    .sort(
      (first, second) =>
        first.stageSequence - second.stageSequence,
    )[0];

  if (!currentStage) {
    throw new Error(
      "No pending MOP stage exists for this beneficiary.",
    );
  }

  if (
    !currentStage.eligibleUserIds.includes(
      input.actionedByUserId,
    )
  ) {
    throw new Error(
      "You are not eligible to action the current MOP stage.",
    );
  }

  const userAlreadyActioned =
    database.approvalDecisions.some(
      (decision) =>
        decision.approvalRequestStageId ===
          currentStage.id &&
        decision.actionedByUserId ===
          input.actionedByUserId,
    );

  if (userAlreadyActioned) {
    throw new Error(
      "You have already actioned this approval stage.",
    );
  }

  const actionedAt = new Date().toISOString();

  updateMockDatabase((updatedDatabase) => {
    const storedBeneficiary =
      updatedDatabase.beneficiaries.find(
        (item) =>
          item.id === input.beneficiaryId,
      );

    if (!storedBeneficiary) {
      throw new Error(
        "The beneficiary request could not be found.",
      );
    }

    const storedCurrentStage =
      updatedDatabase.approvalStages.find(
        (stage) => stage.id === currentStage.id,
      );

    if (!storedCurrentStage) {
      throw new Error(
        "The current approval stage could not be found.",
      );
    }

    updatedDatabase.approvalDecisions.push({
      id: crypto.randomUUID(),

      approvalRequestStageId:
        storedCurrentStage.id,

      requestId: storedBeneficiary.id,
      requestReference:
        storedBeneficiary.beneficiaryReference,

      stageId: storedCurrentStage.stageId,
      stageSequence:
        storedCurrentStage.stageSequence,

      action: "REJECTED",

      actionedByUserId:
        input.actionedByUserId,

      actionedByName:
        input.actionedByName,

      actionedAt,
      remarks,
    });

    storedCurrentStage.status = "REJECTED";
    storedCurrentStage.completedAt = actionedAt;

    updatedDatabase.approvalStages
      .filter(
        (stage) =>
          stage.requestId ===
            storedBeneficiary.id &&
          stage.id !== storedCurrentStage.id &&
          (stage.status === "PENDING" ||
            stage.status === "IN_PROGRESS"),
      )
      .forEach((stage) => {
        stage.status = "REJECTED";
        stage.completedAt = actionedAt;
      });

    updatedDatabase.bankAuthorisationSessions
      .filter(
        (session) =>
          session.requestId ===
            storedBeneficiary.id &&
          (session.status === "CREATED" ||
            session.status === "AUTHENTICATED"),
      )
      .forEach((session) => {
        session.status = "REJECTED";
        session.completedAt = actionedAt;
      });

    storedBeneficiary.status = "REJECTED";
    storedBeneficiary.rejectedAt = actionedAt;
    storedBeneficiary.rejectionReason = remarks;
  });

  return {
    beneficiaryId: beneficiary.id,
    beneficiaryReference:
      beneficiary.beneficiaryReference,
    status: "REJECTED",
    message:
      "The beneficiary request has been rejected.",
  };
}

export async function getApprovalTrayItems(
  organisationId: string,
  userId: string,
): Promise<ApprovalTrayItem[]> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 300);
  });

  const database = getMockDatabase();

  const eligibleStages = database.approvalStages
    .filter(
      (stage) =>
        stage.organisationId === organisationId &&
        stage.eligibleUserIds.includes(userId) &&
        (stage.status === "PENDING" ||
          stage.status === "IN_PROGRESS"),
    )
    .sort(
      (first, second) =>
        first.stageSequence - second.stageSequence,
    );

  const trayItems = eligibleStages
    .map((approvalStage): ApprovalTrayItem | null => {
      const decisions =
        database.approvalDecisions.filter(
          (decision) =>
            decision.approvalRequestStageId ===
            approvalStage.id,
        );

      const userAlreadyActioned = decisions.some(
        (decision) =>
          decision.actionedByUserId === userId,
      );

      if (userAlreadyActioned) {
        return null;
      }

      if (
        approvalStage.requestType ===
        "BENEFICIARY_CREATION"
      ) {
        const beneficiary =
          database.beneficiaries.find(
            (item) =>
              item.id === approvalStage.requestId,
          );

        if (!beneficiary) {
          return null;
        }

        return {
          requestType: "BENEFICIARY",

          requestId: beneficiary.id,
          requestReference:
            beneficiary.beneficiaryReference,
          organisationId:
            beneficiary.organisationId,

          title: beneficiary.beneficiaryName,
          subtitle: `${beneficiary.bankName} | ${beneficiary.maskedAccountNumber}`,

          requestStatus: beneficiary.status,

          submittedAt:
            beneficiary.submittedAt ??
            beneficiary.createdAt,

          approvalStage,
          decisions,
        };
      }

      if (
        approvalStage.requestType === "PAYMENT"
      ) {
        const payment = database.payments.find(
          (item) =>
            item.id === approvalStage.requestId,
        );

        if (!payment) {
          return null;
        }

        return {
          requestType: "PAYMENT",

          requestId: payment.id,
          requestReference:
            payment.paymentReference,
          organisationId:
            payment.organisationId,

          title: payment.beneficiaryName,
          subtitle: `${payment.paymentMode} | ${payment.maskedDebitAccountNumber}`,

          amount: payment.amount,
          currency: payment.currency,

          requestStatus: payment.status,

          submittedAt:
            payment.submittedAt ??
            payment.createdAt,

          approvalStage,
          decisions,
        };
      }

      return null;
    })
    .filter(
      (
        item,
      ): item is ApprovalTrayItem =>
        item !== null,
    );

  return trayItems.sort(
    (first, second) =>
      new Date(second.submittedAt).getTime() -
      new Date(first.submittedAt).getTime(),
  );
}


export type TimelineAuthoriser = {
  userId: string;
  name: string;
  role: string;
  status: "APPROVED" | "REJECTED" | "RETURNED" | "PENDING";
  actedAt?: string;
  remarks?: string;
};

export type ApprovalTimelineStage = {
  sequence: number;
  stageName: string;
  requiredApprovals: number;
  approvedCount: number;
  status: ApprovalRequestStage["status"];
  authorisers: TimelineAuthoriser[];
};

export function getApprovalTimeline(
  requestId: string,
): ApprovalTimelineStage[] {
  const database = getMockDatabase();

  return database.approvalStages
    .filter((stage) => stage.requestId === requestId)
    .sort(
      (first, second) =>
        first.stageSequence - second.stageSequence,
    )
    .map((stage) => {
      const decisions = getStageDecisions(
        stage,
        database.approvalDecisions,
      );

      return {
        sequence: stage.stageSequence,
        stageName: stage.stageName,
        requiredApprovals: stage.requiredApprovals,
        approvedCount: getStageApprovalCount(
          stage,
          database.approvalDecisions,
        ),
        status: stage.status,
        authorisers: stage.eligibleUserIds.flatMap(
          (userId) => {
            const eligibleUser = database.users.find(
              (item) => item.id === userId,
            );

            if (!eligibleUser) {
              return [];
            }

            const decision = decisions.find(
              (item) => item.actionedByUserId === userId,
            );

            return [
              {
                userId,
                name: eligibleUser.fullName,
                role: eligibleUser.role
                  .split("_")
                  .map(
                    (word) =>
                      word[0] + word.slice(1).toLowerCase(),
                  )
                  .join(" "),
                status: decision?.action ?? "PENDING",
                actedAt: decision?.actionedAt,
                remarks: decision?.remarks,
              } as TimelineAuthoriser,
            ];
          },
        ),
      };
    });
}
