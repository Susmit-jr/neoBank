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

export type RequestKind = "BENEFICIARY" | "PAYMENT";

export type RejectRequestInput = {
  requestKind: RequestKind;
  requestId: string;
  actionedByUserId: string;
  actionedByName: string;
  remarks: string;
};

export type RequestActionResult = {
  requestId: string;
  requestReference: string;
  status: "REJECTED" | "CANCELLED";
  message: string;
};

const OPEN_STATUSES = [
  "PENDING_AUTHORISATION",
  "AUTHORISATION_IN_PROGRESS",
  "AWAITING_NEXT_AUTHORISER",
];

function findRequest(
  database: ReturnType<typeof getMockDatabase>,
  requestKind: RequestKind,
  requestId: string,
) {
  const request =
    requestKind === "PAYMENT"
      ? database.payments.find(
          (item) => item.id === requestId,
        )
      : database.beneficiaries.find(
          (item) => item.id === requestId,
        );

  if (!request) {
    throw new Error("The request could not be found.");
  }

  if (!OPEN_STATUSES.includes(request.status)) {
    throw new Error(
      "This request is no longer awaiting authorisation.",
    );
  }

  return request;
}

function getReference(
  request: ReturnType<typeof findRequest>,
): string {
  return "paymentReference" in request
    ? request.paymentReference
    : request.beneficiaryReference;
}

// Closes every open stage and bank session for the request, then marks it final.
function closeRequest(
  database: ReturnType<typeof getMockDatabase>,
  requestId: string,
  stageStatus: "REJECTED",
  sessionStatus: "REJECTED",
  at: string,
) {
  database.approvalStages
    .filter(
      (stage) =>
        stage.requestId === requestId &&
        (stage.status === "PENDING" ||
          stage.status === "IN_PROGRESS"),
    )
    .forEach((stage) => {
      stage.status = stageStatus;
      stage.completedAt = at;
    });

  database.bankAuthorisationSessions
    .filter(
      (session) =>
        session.requestId === requestId &&
        (session.status === "CREATED" ||
          session.status === "AUTHENTICATED"),
    )
    .forEach((session) => {
      session.status = sessionStatus;
      session.completedAt = at;
    });
}

// A rejection by any checker cancels the request for good; the maker must start again.
export async function rejectRequest(
  input: RejectRequestInput,
): Promise<RequestActionResult> {
  const remarks = input.remarks.trim();

  if (!remarks) {
    throw new Error("Rejection remarks are mandatory.");
  }

  const database = getMockDatabase();

  const request = findRequest(
    database,
    input.requestKind,
    input.requestId,
  );

  if (request.createdByUserId === input.actionedByUserId) {
    throw new Error(
      "The Maker cannot reject their own request.",
    );
  }

  const currentStage = getCurrentApprovalStage(
    database.approvalStages.filter(
      (stage) => stage.requestId === input.requestId,
    ),
  );

  if (!currentStage) {
    throw new Error(
      "No pending MOP stage exists for this request.",
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

  if (
    database.approvalDecisions.some(
      (decision) =>
        decision.approvalRequestStageId ===
          currentStage.id &&
        decision.actionedByUserId ===
          input.actionedByUserId,
    )
  ) {
    throw new Error(
      "You have already actioned this approval stage.",
    );
  }

  const actionedAt = new Date().toISOString();
  const requestReference = getReference(request);

  updateMockDatabase((updatedDatabase) => {
    updatedDatabase.approvalDecisions.push({
      id: crypto.randomUUID(),
      approvalRequestStageId: currentStage.id,
      requestId: input.requestId,
      requestReference,
      stageId: currentStage.stageId,
      stageSequence: currentStage.stageSequence,
      action: "REJECTED",
      actionedByUserId: input.actionedByUserId,
      actionedByName: input.actionedByName,
      actionedAt,
      remarks,
    });

    closeRequest(
      updatedDatabase,
      input.requestId,
      "REJECTED",
      "REJECTED",
      actionedAt,
    );

    const stored =
      input.requestKind === "PAYMENT"
        ? updatedDatabase.payments.find(
            (item) => item.id === input.requestId,
          )
        : updatedDatabase.beneficiaries.find(
            (item) => item.id === input.requestId,
          );

    if (stored) {
      stored.status = "REJECTED";
      stored.rejectedAt = actionedAt;
      stored.rejectionReason = remarks;
    }
  });

  return {
    requestId: input.requestId,
    requestReference,
    status: "REJECTED",
    message:
      input.requestKind === "PAYMENT"
        ? "The payment has been rejected and cancelled. The maker must initiate it again."
        : "The beneficiary request has been rejected and cancelled. The maker must submit it again.",
  };
}

// The maker can withdraw a request until a checker has acted on it.
export async function cancelRequest(input: {
  requestKind: RequestKind;
  requestId: string;
  cancelledByUserId: string;
}): Promise<RequestActionResult> {
  const database = getMockDatabase();

  const request = findRequest(
    database,
    input.requestKind,
    input.requestId,
  );

  if (request.createdByUserId !== input.cancelledByUserId) {
    throw new Error(
      "Only the maker who created this request can cancel it.",
    );
  }

  if (
    database.approvalDecisions.some(
      (decision) =>
        decision.requestId === input.requestId,
    )
  ) {
    throw new Error(
      "A checker has already acted on this request, so it can no longer be cancelled.",
    );
  }

  const cancelledAt = new Date().toISOString();
  const requestReference = getReference(request);

  updateMockDatabase((updatedDatabase) => {
    closeRequest(
      updatedDatabase,
      input.requestId,
      "REJECTED",
      "REJECTED",
      cancelledAt,
    );

    const stored =
      input.requestKind === "PAYMENT"
        ? updatedDatabase.payments.find(
            (item) => item.id === input.requestId,
          )
        : updatedDatabase.beneficiaries.find(
            (item) => item.id === input.requestId,
          );

    if (stored) {
      stored.status = "CANCELLED";
    }
  });

  return {
    requestId: input.requestId,
    requestReference,
    status: "CANCELLED",
    message: "The request has been cancelled.",
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
