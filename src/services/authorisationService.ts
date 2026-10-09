import { mockBankUsers } from "../mock-data/bankUsers";
import type {
  ApprovalDecision,
  ApprovalRequestStage,
  BankAuthorisationSession,
} from "../types/approval";
import type { Beneficiary } from "../types/banking";
import {
  getMockDatabase,
  updateMockDatabase,
} from "./mockDatabase";

import type { Payment } from "../types/payment";

const SESSION_VALIDITY_MINUTES = 10;

export type BankLoginInput = {
  sessionId: string;
  corporateId: string;
  bankUserId: string;
  password: string;
};

export type StageAuthoriser = {
  userId: string;
  name: string;
  role: string;
  status: "APPROVED" | "YOU" | "PENDING";
};

export const BANK_OTP_MAX_ATTEMPTS = 3;
// shortcut: fixed OTP for the demo, replace with the bank's OTP service
const DEMO_OTP = "123456";

export type BankSessionDetails = (
  | {
      requestType: "BENEFICIARY_CREATION";
      session: BankAuthorisationSession;
      beneficiary: Beneficiary;
      payment?: never;
      approvalStage: ApprovalRequestStage;
    }
  | {
      requestType: "PAYMENT";
      session: BankAuthorisationSession;
      beneficiary?: never;
      payment: Payment;
      approvalStage: ApprovalRequestStage;
    }
) & { authorisers: StageAuthoriser[] };

export type CompleteAuthorisationResult = {
  beneficiary: Beneficiary;
  nextStageExists: boolean;
  message: string;
};

function delay(milliseconds = 400) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function isSessionExpired(
  session: BankAuthorisationSession,
): boolean {
  return new Date() > new Date(session.expiresAt);
}

function countStageApprovals(
  stageId: string,
  decisions: ApprovalDecision[],
): number {
  return decisions.filter(
    (decision) =>
      decision.approvalRequestStageId === stageId &&
      decision.action === "APPROVED",
  ).length;
}

function awaitingMessage(
  database: ReturnType<typeof getMockDatabase>,
  stage: ApprovalRequestStage,
  approvalCount: number,
): string {
  const approvedIds = new Set(
    database.approvalDecisions
      .filter(
        (item) =>
          item.approvalRequestStageId === stage.id &&
          item.action === "APPROVED",
      )
      .map((item) => item.actionedByUserId),
  );

  const pendingNames = stage.eligibleUserIds
    .filter((id) => !approvedIds.has(id))
    .map(
      (id) =>
        database.users.find((user) => user.id === id)
          ?.fullName,
    )
    .filter(Boolean);

  return `Your authorisation has been recorded. ${approvalCount} of ${stage.requiredApprovals} authorisations completed. Awaiting ${stage.requiredApprovals - approvalCount} more from: ${pendingNames.join(", ")}.`;
}

export async function createBankAuthorisationSession(
  beneficiaryId: string,
  platformUserId: string,
): Promise<BankAuthorisationSession> {
  await delay();

  const database = getMockDatabase();

  const beneficiary = database.beneficiaries.find(
    (item) => item.id === beneficiaryId,
  );

  if (!beneficiary) {
    throw new Error(
      "The beneficiary request could not be found.",
    );
  }

  if (
    beneficiary.status !== "PENDING_AUTHORISATION" &&
    beneficiary.status !== "AWAITING_NEXT_AUTHORISER" &&
    beneficiary.status !== "AUTHORISATION_IN_PROGRESS"
  ) {
    throw new Error(
      "This beneficiary is not available for authorisation.",
    );
  }

  if (beneficiary.createdByUserId === platformUserId) {
    throw new Error(
      "The Maker cannot authorise their own beneficiary request.",
    );
  }

  const currentStage = database.approvalStages
    .filter(
      (stage) =>
        stage.requestId === beneficiaryId &&
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
    !currentStage.eligibleUserIds.includes(platformUserId)
  ) {
    throw new Error(
      "You are not eligible to authorise the current MOP stage.",
    );
  }

  const alreadyActioned =
    database.approvalDecisions.some(
      (decision) =>
        decision.approvalRequestStageId ===
          currentStage.id &&
        decision.actionedByUserId === platformUserId,
    );

  if (alreadyActioned) {
    throw new Error(
      "You have already actioned this authorisation stage.",
    );
  }

  const existingUsableSession =
    database.bankAuthorisationSessions.find(
      (session) =>
        session.requestId === beneficiaryId &&
        session.platformUserId === platformUserId &&
        session.approvalRequestStageId ===
          currentStage.id &&
        (session.status === "CREATED" ||
          session.status === "AUTHENTICATED") &&
        !isSessionExpired(session),
    );

  if (existingUsableSession) {
    return existingUsableSession;
  }

  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
      SESSION_VALIDITY_MINUTES * 60 * 1000,
  );

  const session: BankAuthorisationSession = {
    id: crypto.randomUUID(),

    requestId: beneficiary.id,
    requestReference:
      beneficiary.beneficiaryReference,
    requestType: "BENEFICIARY_CREATION",

    organisationId: beneficiary.organisationId,
    platformUserId,

    approvalRequestStageId: currentStage.id,
    stageSequence: currentStage.stageSequence,

    status: "CREATED",

    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  updateMockDatabase((updatedDatabase) => {
    updatedDatabase.bankAuthorisationSessions.push(
      session,
    );

    const storedStage =
      updatedDatabase.approvalStages.find(
        (stage) => stage.id === currentStage.id,
      );

    if (storedStage) {
      storedStage.status = "IN_PROGRESS";
      storedStage.startedAt ??= now.toISOString();
    }

    const storedBeneficiary =
      updatedDatabase.beneficiaries.find(
        (item) => item.id === beneficiary.id,
      );

    if (storedBeneficiary) {
      storedBeneficiary.status =
        "AUTHORISATION_IN_PROGRESS";
    }
  });

  return session;
}

export async function createPaymentBankAuthorisationSession(
  paymentId: string,
  platformUserId: string,
): Promise<BankAuthorisationSession> {
  await delay();

  const database = getMockDatabase();

  const payment = database.payments.find(
    (item) => item.id === paymentId,
  );

  if (!payment) {
    throw new Error(
      "The payment request could not be found.",
    );
  }

  const actionableStatuses = [
    "PENDING_AUTHORISATION",
    "AUTHORISATION_IN_PROGRESS",
    "AWAITING_NEXT_AUTHORISER",
  ];

  if (!actionableStatuses.includes(payment.status)) {
    throw new Error(
      "This payment is not available for authorisation.",
    );
  }

  if (payment.createdByUserId === platformUserId) {
    throw new Error(
      "The Maker cannot authorise their own payment.",
    );
  }

  const currentStage = database.approvalStages
    .filter(
      (stage) =>
        stage.requestId === paymentId &&
        stage.requestType === "PAYMENT" &&
        (stage.status === "PENDING" ||
          stage.status === "IN_PROGRESS"),
    )
    .sort(
      (first, second) =>
        first.stageSequence - second.stageSequence,
    )[0];

  if (!currentStage) {
    throw new Error(
      "No pending MOP stage exists for this payment.",
    );
  }

  if (!currentStage.eligibleUserIds.includes(platformUserId)) {
    throw new Error(
      "You are not eligible to authorise the current payment MOP stage.",
    );
  }

  const alreadyActioned =
    database.approvalDecisions.some(
      (decision) =>
        decision.approvalRequestStageId ===
          currentStage.id &&
        decision.actionedByUserId === platformUserId,
    );

  if (alreadyActioned) {
    throw new Error(
      "You have already actioned this payment authorisation stage.",
    );
  }

  const existingUsableSession =
    database.bankAuthorisationSessions.find(
      (session) =>
        session.requestId === paymentId &&
        session.requestType === "PAYMENT" &&
        session.platformUserId === platformUserId &&
        session.approvalRequestStageId ===
          currentStage.id &&
        (session.status === "CREATED" ||
          session.status === "AUTHENTICATED") &&
        !isSessionExpired(session),
    );

  if (existingUsableSession) {
    return existingUsableSession;
  }

  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
      SESSION_VALIDITY_MINUTES * 60 * 1000,
  );

  const session: BankAuthorisationSession = {
    id: crypto.randomUUID(),

    requestId: payment.id,
    requestReference: payment.paymentReference,
    requestType: "PAYMENT",

    organisationId: payment.organisationId,
    platformUserId,

    approvalRequestStageId: currentStage.id,
    stageSequence: currentStage.stageSequence,

    status: "CREATED",

    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  updateMockDatabase((updatedDatabase) => {
    updatedDatabase.bankAuthorisationSessions.push(
      session,
    );

    const storedStage =
      updatedDatabase.approvalStages.find(
        (stage) => stage.id === currentStage.id,
      );

    if (storedStage) {
      storedStage.status = "IN_PROGRESS";
      storedStage.startedAt ??= now.toISOString();
    }

    const storedPayment =
      updatedDatabase.payments.find(
        (item) => item.id === payment.id,
      );

    if (storedPayment) {
      storedPayment.status =
        "AUTHORISATION_IN_PROGRESS";
    }
  });

  return session;
}

export async function getBankSessionDetails(
  sessionId: string,
): Promise<BankSessionDetails> {
  await delay(200);

  const database = getMockDatabase();

  const session =
    database.bankAuthorisationSessions.find(
      (item) => item.id === sessionId,
    );

  if (!session) {
    throw new Error(
      "The bank authorisation session could not be found.",
    );
  }

  if (
    session.status !== "APPROVED" &&
    session.status !== "REJECTED" &&
    isSessionExpired(session)
  ) {
    updateMockDatabase((updatedDatabase) => {
      const storedSession =
        updatedDatabase.bankAuthorisationSessions.find(
          (item) => item.id === sessionId,
        );

      if (storedSession) {
        storedSession.status = "EXPIRED";
      }

      if (
        session.requestType ===
        "BENEFICIARY_CREATION"
      ) {
        const beneficiary =
          updatedDatabase.beneficiaries.find(
            (item) =>
              item.id === session.requestId,
          );

        if (beneficiary) {
          beneficiary.status =
            "AUTHORISATION_EXPIRED";
        }
      }

      if (session.requestType === "PAYMENT") {
        const payment =
          updatedDatabase.payments.find(
            (item) =>
              item.id === session.requestId,
          );

        if (payment) {
          payment.status =
            "AUTHORISATION_EXPIRED";
        }
      }
    });

    throw new Error(
      "The bank authorisation session has expired.",
    );
  }

  const approvalStage =
    database.approvalStages.find(
      (item) =>
        item.id ===
        session.approvalRequestStageId,
    );

  if (!approvalStage) {
    throw new Error(
      "The approval-stage details could not be found.",
    );
  }

  const approvedUserIds = new Set(
    database.approvalDecisions
      .filter(
        (item) =>
          item.approvalRequestStageId ===
            approvalStage.id &&
          item.action === "APPROVED",
      )
      .map((item) => item.actionedByUserId),
  );

  const authorisers: StageAuthoriser[] =
    approvalStage.eligibleUserIds.flatMap(
      (userId) => {
        const eligibleUser = database.users.find(
          (item) => item.id === userId,
        );

        if (!eligibleUser) {
          return [];
        }

        return [
          {
            userId,
            name: eligibleUser.fullName,
            role: eligibleUser.role
              .split("_")
              .map((word) => word[0] + word.slice(1).toLowerCase())
              .join(" "),
            status: approvedUserIds.has(userId)
              ? "APPROVED"
              : userId === session.platformUserId
                ? "YOU"
                : "PENDING",
          } as const,
        ];
      },
    );

  if (
    session.requestType ===
    "BENEFICIARY_CREATION"
  ) {
    const beneficiary =
      database.beneficiaries.find(
        (item) =>
          item.id === session.requestId,
      );

    if (!beneficiary) {
      throw new Error(
        "The beneficiary request could not be found.",
      );
    }

    return {
      requestType: "BENEFICIARY_CREATION",
      session,
      beneficiary,
      approvalStage,
      authorisers,
    };
  }

  if (session.requestType === "PAYMENT") {
    const payment = database.payments.find(
      (item) =>
        item.id === session.requestId,
    );

    if (!payment) {
      throw new Error(
        "The payment request could not be found.",
      );
    }

    return {
      requestType: "PAYMENT",
      session,
      payment,
      approvalStage,
      authorisers,
    };
  }

  throw new Error(
    "The bank authorisation request type is not supported.",
  );
}

export async function authenticateBankUser(
  input: BankLoginInput,
): Promise<void> {
  await delay();

  const details = await getBankSessionDetails(
    input.sessionId,
  );
  if (details.session.status !== "CREATED") {
  throw new Error(
    "This bank authorisation session is not available for authentication.",
  );
}
  const bankUser = mockBankUsers.find(
    (item) =>
      item.corporateId.toUpperCase() ===
        input.corporateId.trim().toUpperCase() &&
      item.bankUserId.toLowerCase() ===
        input.bankUserId.trim().toLowerCase(),
  );

  if (!bankUser || bankUser.password !== input.password) {
    throw new Error(
      "The bank credentials entered are incorrect.",
    );
  }

  if (!bankUser.isActive) {
    throw new Error("The bank user is inactive.");
  }

  if (
    bankUser.organisationId !==
    details.session.organisationId
  ) {
    throw new Error(
      "The bank user is not mapped to this corporate customer.",
    );
  }

  if (
    bankUser.platformUserId !==
    details.session.platformUserId
  ) {
    throw new Error(
      "The bank user does not match the NeoBank authoriser.",
    );
  }

  updateMockDatabase((database) => {
    const session =
      database.bankAuthorisationSessions.find(
        (item) => item.id === input.sessionId,
      );

    if (session) {
      session.credentialsVerified = true;
    }
  });
}

export async function verifyBankOtp(
  sessionId: string,
  otp: string,
): Promise<void> {
  await delay();

  const { session } = await getBankSessionDetails(
    sessionId,
  );

  if (
    session.status !== "CREATED" ||
    !session.credentialsVerified
  ) {
    throw new Error(
      "This bank authorisation session is not available for verification.",
    );
  }

  if (
    (session.otpAttempts ?? 0) >=
    BANK_OTP_MAX_ATTEMPTS
  ) {
    throw new Error(
      "Too many incorrect attempts. Close this window and restart authorisation.",
    );
  }

  if (otp.trim() !== DEMO_OTP) {
    const attempts = (session.otpAttempts ?? 0) + 1;

    updateMockDatabase((database) => {
      const stored =
        database.bankAuthorisationSessions.find(
          (item) => item.id === sessionId,
        );

      if (stored) {
        stored.otpAttempts = attempts;
      }
    });

    throw new Error(
      attempts >= BANK_OTP_MAX_ATTEMPTS
        ? "Too many incorrect attempts. Close this window and restart authorisation."
        : `The OTP entered is incorrect. ${BANK_OTP_MAX_ATTEMPTS - attempts} attempt(s) remaining.`,
    );
  }

  updateMockDatabase((database) => {
    const stored =
      database.bankAuthorisationSessions.find(
        (item) => item.id === sessionId,
      );

    if (stored) {
      stored.status = "AUTHENTICATED";
    }
  });
}

export async function approveThroughBank(
  sessionId: string,
): Promise<CompleteAuthorisationResult> {
  await delay();

  let result:
    | CompleteAuthorisationResult
    | undefined;

  updateMockDatabase((database) => {
    const session =
      database.bankAuthorisationSessions.find(
        (item) => item.id === sessionId,
      );

    if (!session) {
      throw new Error(
        "The bank authorisation session could not be found.",
      );
    }

    if (session.status !== "AUTHENTICATED") {
      throw new Error(
        "Bank authentication must be completed before authorisation.",
      );
    }

    if (isSessionExpired(session)) {
      session.status = "EXPIRED";

      throw new Error(
        "The bank authorisation session has expired.",
      );
    }

    const beneficiary = database.beneficiaries.find(
      (item) => item.id === session.requestId,
    );

    const currentStage =
      database.approvalStages.find(
        (stage) =>
          stage.id === session.approvalRequestStageId,
      );

    if (!beneficiary || !currentStage) {
      throw new Error(
        "The beneficiary authorisation details are incomplete.",
      );
    }

    const duplicateDecision =
      database.approvalDecisions.some(
        (decision) =>
          decision.approvalRequestStageId ===
            currentStage.id &&
          decision.actionedByUserId ===
            session.platformUserId,
      );

    if (duplicateDecision) {
      throw new Error(
        "This authoriser has already actioned the current stage.",
      );
    }

    const platformUserDecision: ApprovalDecision = {
      id: crypto.randomUUID(),

      approvalRequestStageId: currentStage.id,
      requestId: beneficiary.id,
      requestReference:
        beneficiary.beneficiaryReference,

      stageId: currentStage.stageId,
      stageSequence: currentStage.stageSequence,

      action: "APPROVED",

      actionedByUserId: session.platformUserId,
      actionedByName:
        mockBankUsers.find(
          (user) =>
            user.platformUserId ===
            session.platformUserId,
        )?.fullName ?? "Bank Authoriser",

      actionedAt: new Date().toISOString(),

      bankAuthorisationSessionId: session.id,
    };

    database.approvalDecisions.push(
      platformUserDecision,
    );

    session.status = "APPROVED";
    session.completedAt = new Date().toISOString();

    const approvalCount = countStageApprovals(
      currentStage.id,
      database.approvalDecisions,
    );

    if (
      approvalCount <
      currentStage.requiredApprovals
    ) {
      currentStage.status = "IN_PROGRESS";

      beneficiary.status =
        "PENDING_AUTHORISATION";

      result = {
        beneficiary: structuredClone(beneficiary),
        nextStageExists: false,
        message: awaitingMessage(database, currentStage, approvalCount),
      };

      return;
    }

    currentStage.status = "COMPLETED";
    currentStage.completedAt =
      new Date().toISOString();

    const nextStage = database.approvalStages
      .filter(
        (stage) =>
          stage.requestId === beneficiary.id &&
          stage.stageSequence >
            currentStage.stageSequence &&
          stage.status === "PENDING",
      )
      .sort(
        (first, second) =>
          first.stageSequence - second.stageSequence,
      )[0];

    if (nextStage) {
      beneficiary.status =
        "AWAITING_NEXT_AUTHORISER";

      beneficiary.currentApprovalStageSequence =
        nextStage.stageSequence;

      result = {
        beneficiary: structuredClone(beneficiary),
        nextStageExists: true,
        message:
          "Authorisation completed. The request has moved to the next MOP authorisation stage.",
      };

      return;
    }

    beneficiary.status = "ACTIVE";
    beneficiary.activatedAt =
      new Date().toISOString();

    result = {
      beneficiary: structuredClone(beneficiary),
      nextStageExists: false,
      message:
        "All MOP authorisations are complete. The beneficiary is now active.",
    };
  });

  if (!result) {
    throw new Error(
      "The authorisation result could not be determined.",
    );
  }

  return result;
}

export type CompletePaymentAuthorisationResult = {
  payment: Payment;
  nextStageExists: boolean;
  message: string;
};

export async function approvePaymentThroughBank(
  sessionId: string,
): Promise<CompletePaymentAuthorisationResult> {
  await delay();

  let result:
    | CompletePaymentAuthorisationResult
    | undefined;

  updateMockDatabase((database) => {
    const session =
      database.bankAuthorisationSessions.find(
        (item) => item.id === sessionId,
      );

    if (!session) {
      throw new Error(
        "The bank authorisation session could not be found.",
      );
    }

    if (session.requestType !== "PAYMENT") {
      throw new Error(
        "This session is not associated with a payment.",
      );
    }

    if (session.status !== "AUTHENTICATED") {
      throw new Error(
        "Bank authentication must be completed before authorisation.",
      );
    }

    if (isSessionExpired(session)) {
      session.status = "EXPIRED";

      throw new Error(
        "The bank authorisation session has expired.",
      );
    }

    const payment = database.payments.find(
      (item) =>
        item.id === session.requestId,
    );

    const currentStage =
      database.approvalStages.find(
        (stage) =>
          stage.id ===
          session.approvalRequestStageId,
      );

    if (!payment || !currentStage) {
      throw new Error(
        "The payment authorisation details are incomplete.",
      );
    }

    const duplicateDecision =
      database.approvalDecisions.some(
        (decision) =>
          decision.approvalRequestStageId ===
            currentStage.id &&
          decision.actionedByUserId ===
            session.platformUserId,
      );

    if (duplicateDecision) {
      throw new Error(
        "This authoriser has already actioned the current stage.",
      );
    }

    const bankUser = mockBankUsers.find(
      (item) =>
        item.platformUserId ===
        session.platformUserId,
    );

    const actionedAt = new Date().toISOString();

    const decision: ApprovalDecision = {
      id: crypto.randomUUID(),

      approvalRequestStageId:
        currentStage.id,

      requestId: payment.id,
      requestReference:
        payment.paymentReference,

      stageId: currentStage.stageId,
      stageSequence:
        currentStage.stageSequence,

      action: "APPROVED",

      actionedByUserId:
        session.platformUserId,

      actionedByName:
        bankUser?.fullName ??
        "Bank Authoriser",

      actionedAt,

      bankAuthorisationSessionId:
        session.id,
    };

    database.approvalDecisions.push(decision);

    session.status = "APPROVED";
    session.completedAt = actionedAt;

    const approvalCount =
      countStageApprovals(
        currentStage.id,
        database.approvalDecisions,
      );

    if (
      approvalCount <
      currentStage.requiredApprovals
    ) {
      currentStage.status = "IN_PROGRESS";

      payment.status =
        "PENDING_AUTHORISATION";

      result = {
        payment: structuredClone(payment),
        nextStageExists: false,
        message: awaitingMessage(database, currentStage, approvalCount),
      };

      return;
    }

    currentStage.status = "COMPLETED";
    currentStage.completedAt = actionedAt;

    const nextStage =
      database.approvalStages
        .filter(
          (stage) =>
            stage.requestId === payment.id &&
            stage.requestType === "PAYMENT" &&
            stage.stageSequence >
              currentStage.stageSequence &&
            stage.status === "PENDING",
        )
        .sort(
          (first, second) =>
            first.stageSequence -
            second.stageSequence,
        )[0];

    if (nextStage) {
      payment.status =
        "AWAITING_NEXT_AUTHORISER";

      payment.currentApprovalStageSequence =
        nextStage.stageSequence;

      result = {
        payment: structuredClone(payment),
        nextStageExists: true,
        message:
          "Transaction proceeded for further authorisation.",
      };

      return;
    }

    payment.status = "AUTHORISED";
    payment.authorisedAt = actionedAt;

    result = {
      payment: structuredClone(payment),
      nextStageExists: false,
      message:
        "Transaction authorisation completed successfully.",
    };
  });

  if (!result) {
    throw new Error(
      "The payment authorisation result could not be determined.",
    );
  }

  return result;
}
