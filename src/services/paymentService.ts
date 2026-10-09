import type {
  BankAccount,
  Beneficiary,
} from "../types/banking";

import type {
  CreatePaymentInput,
  Payment,
  PaymentMode,
  PaymentProcessingEvent,
} from "../types/payment";

import type { ModeOfOperation } from "../types/approval";
import { createApprovalStagesFromMop } from "./approvalService";
import { getMockDatabase, updateMockDatabase,} from "./mockDatabase";
import { getApplicableMop } from "./mopService";



function delay(milliseconds = 400) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export type PaymentPreparationData = {
  debitAccounts: BankAccount[];
  beneficiaries: Beneficiary[];
};

export type PaymentValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  potentialDuplicatePayment?: Payment;
};

export type ValidatePaymentInput = {
  organisationId: string;
  debitAccountId: string;
  beneficiaryId: string;

  amount: number;
  paymentMode: PaymentMode;
  scheduledDate: string;

  paymentPurpose: string;
  invoiceReference?: string;
};

export async function getPaymentsByOrganisation(
  organisationId: string,
): Promise<Payment[]> {
  await delay();

  const database = getMockDatabase();

  return database.payments
    .filter(
      (payment) =>
        payment.organisationId === organisationId,
    )
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
}

export async function getPaymentById(
  paymentId: string,
): Promise<Payment | undefined> {
  await delay();

  const database = getMockDatabase();

  return database.payments.find(
    (payment) => payment.id === paymentId,
  );
}

export async function getPaymentProcessingEvents(
  paymentId: string,
): Promise<PaymentProcessingEvent[]> {
  await delay(250);

  const database = getMockDatabase();

  return database.paymentProcessingEvents
    .filter(
      (event) => event.paymentId === paymentId,
    )
    .sort(
      (first, second) =>
        new Date(first.eventTime).getTime() -
        new Date(second.eventTime).getTime(),
    );
}

export async function getPaymentPreparationData(
  organisationId: string,
): Promise<PaymentPreparationData> {
  await delay();

  const database = getMockDatabase();

  const debitAccounts = database.accounts
    .filter(
      (account) =>
        account.organisationId === organisationId &&
        account.status === "ACTIVE",
    )
    .sort(
      (first, second) =>
        Number(second.isPrimary) -
        Number(first.isPrimary),
    );

  const beneficiaries = database.beneficiaries
    .filter(
      (beneficiary) =>
        beneficiary.organisationId ===
          organisationId &&
        beneficiary.status === "ACTIVE",
    )
    .sort((first, second) =>
      first.beneficiaryName.localeCompare(
        second.beneficiaryName,
      ),
    );

  return {
    debitAccounts,
    beneficiaries,
  };
}

export const COOL_OFF_MINUTES = 60;
export const COOL_OFF_LIMIT = 10000;

// A newly activated beneficiary can only receive small payments for the first hour.
export function getBeneficiaryCoolOff(
  beneficiary: { activatedAt?: string } | undefined,
): { active: boolean; endsAt?: string } {
  if (!beneficiary?.activatedAt) {
    return { active: false };
  }

  const endsAt = new Date(
    new Date(beneficiary.activatedAt).getTime() +
      COOL_OFF_MINUTES * 60 * 1000,
  );

  return {
    active: new Date() < endsAt,
    endsAt: endsAt.toISOString(),
  };
}

export async function validatePayment(
  input: ValidatePaymentInput,
): Promise<PaymentValidationResult> {
  await delay(300);

  const database = getMockDatabase();

  const errors: string[] = [];
  const warnings: string[] = [];

  const coolOff = getBeneficiaryCoolOff(
    database.beneficiaries.find(
      (item) => item.id === input.beneficiaryId,
    ),
  );

  if (coolOff.active && input.amount > COOL_OFF_LIMIT) {
    errors.push(
      `This beneficiary was added recently. For the first ${COOL_OFF_MINUTES} minutes, payments to a new beneficiary are limited to ₹${COOL_OFF_LIMIT.toLocaleString("en-IN")}. Reduce the amount or try again after ${new Date(coolOff.endsAt ?? "").toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`,
    );
  }

  const debitAccount = database.accounts.find(
    (account) =>
      account.id === input.debitAccountId &&
      account.organisationId ===
        input.organisationId,
  );

  if (!debitAccount) {
    errors.push(
      "The selected debit account could not be found.",
    );
  } else {
    if (debitAccount.status !== "ACTIVE") {
      errors.push(
        "The selected debit account is not active.",
      );
    }

    if (
      Number.isFinite(input.amount) &&
      input.amount > debitAccount.availableBalance
    ) {
      errors.push(
        "The payment amount exceeds the available account balance.",
      );
    }
  }

  const beneficiary = database.beneficiaries.find(
    (item) =>
      item.id === input.beneficiaryId &&
      item.organisationId === input.organisationId,
  );

  if (!beneficiary) {
    errors.push(
      "The selected beneficiary could not be found.",
    );
  } else if (beneficiary.status !== "ACTIVE") {
    errors.push(
      "Payments can be initiated only for active beneficiaries.",
    );
  }

  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0
  ) {
    errors.push(
      "Payment amount must be greater than zero.",
    );
  }

  if (!input.paymentPurpose.trim()) {
    errors.push("Payment purpose is required.");
  }

  if (!input.scheduledDate) {
    errors.push("Payment date is required.");
  } else {
    const scheduledDate = new Date(
      `${input.scheduledDate}T00:00:00`,
    );

    const currentDate = new Date();

    currentDate.setHours(0, 0, 0, 0);

    if (Number.isNaN(scheduledDate.getTime())) {
      errors.push("Enter a valid payment date.");
    } else if (scheduledDate < currentDate) {
      errors.push(
        "Payment date cannot be earlier than today.",
      );
    }
  }

  if (!input.paymentMode) {
    errors.push("Payment mode is required.");
  }

  const excludedDuplicateStatuses: Payment["status"][] =
    [
      "FAILED",
      "REJECTED",
      "RETURNED",
      "CANCELLED",
      "AUTHORISATION_FAILED",
      "AUTHORISATION_EXPIRED",
    ];

  const potentialDuplicatePayment =
    database.payments.find(
      (payment) =>
        payment.organisationId ===
          input.organisationId &&
        payment.debitAccountId ===
          input.debitAccountId &&
        payment.beneficiaryId ===
          input.beneficiaryId &&
        payment.amount === input.amount &&
        payment.scheduledDate ===
          input.scheduledDate &&
        !excludedDuplicateStatuses.includes(
          payment.status,
        ),
    );

  if (potentialDuplicatePayment) {
    warnings.push(
      `A similar payment already exists with reference ${potentialDuplicatePayment.paymentReference} and status ${potentialDuplicatePayment.status.replaceAll(
        "_",
        " ",
      )}.`,
    );
  }

  const normalizedInvoiceReference =
    input.invoiceReference?.trim().toLowerCase();

  if (normalizedInvoiceReference) {
    const paymentWithSameInvoice =
      database.payments.find(
        (payment) =>
          payment.organisationId ===
            input.organisationId &&
          payment.invoiceReference
            ?.trim()
            .toLowerCase() ===
            normalizedInvoiceReference &&
          !excludedDuplicateStatuses.includes(
            payment.status,
          ),
      );

    if (
      paymentWithSameInvoice &&
      paymentWithSameInvoice.id !==
        potentialDuplicatePayment?.id
    ) {
      warnings.push(
        `Invoice reference ${input.invoiceReference} is already associated with payment ${paymentWithSameInvoice.paymentReference}.`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    potentialDuplicatePayment,
  };
}

export function preparePaymentInput(
  input: CreatePaymentInput,
): CreatePaymentInput {
  return {
    ...input,

    paymentPurpose: input.paymentPurpose.trim(),

    remarks:
      input.remarks?.trim() || undefined,

    customerReference:
      input.customerReference?.trim() ||
      undefined,

    invoiceReference:
      input.invoiceReference?.trim() ||
      undefined,
  };
}

export type SubmitPaymentResult = {
  payment: Payment;
  appliedMop: ModeOfOperation;
  message: string;
};

function generatePaymentReference(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `PAYREF-${datePart}-${randomPart}`;
}

function maskPaymentAccountNumber(
  accountNumber: string,
): string {
  const normalizedAccountNumber =
    accountNumber.replaceAll(" ", "");

  const visibleDigits =
    normalizedAccountNumber.slice(-4);

  const hiddenLength = Math.max(
    normalizedAccountNumber.length -
      visibleDigits.length,
    4,
  );

  return `${"X".repeat(
    hiddenLength,
  )}${visibleDigits}`;
}

export async function submitPayment(
  rawInput: CreatePaymentInput,
): Promise<SubmitPaymentResult> {
  const input = preparePaymentInput(rawInput);

  const validationResult = await validatePayment({
    organisationId: input.organisationId,
    debitAccountId: input.debitAccountId,
    beneficiaryId: input.beneficiaryId,
    amount: input.amount,
    paymentMode: input.paymentMode,
    scheduledDate: input.scheduledDate,
    paymentPurpose: input.paymentPurpose,
    invoiceReference: input.invoiceReference,
  });

  if (!validationResult.isValid) {
    throw new Error(
      validationResult.errors.join(" "),
    );
  }

  const database = getMockDatabase();

  const debitAccount = database.accounts.find(
    (account) =>
      account.id === input.debitAccountId &&
      account.organisationId ===
        input.organisationId,
  );

  if (!debitAccount) {
    throw new Error(
      "The selected debit account could not be found.",
    );
  }

  const beneficiary = database.beneficiaries.find(
    (item) =>
      item.id === input.beneficiaryId &&
      item.organisationId ===
        input.organisationId,
  );

  if (!beneficiary) {
    throw new Error(
      "The selected beneficiary could not be found.",
    );
  }

  if (beneficiary.status !== "ACTIVE") {
    throw new Error(
      "Payments can be submitted only for active beneficiaries.",
    );
  }

  const applicableMop = await getApplicableMop(
    input.organisationId,
    "PAYMENT",
  );

  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();
  const paymentReference =
    generatePaymentReference();

  const payment: Payment = {
    id: paymentId,
    organisationId: input.organisationId,

    paymentReference,
    paymentType: input.paymentType,
    paymentMode: input.paymentMode,
    priority: input.priority,

    debitAccountId: debitAccount.id,
    debitAccountNumber:
      debitAccount.accountNumber,
    maskedDebitAccountNumber:
      debitAccount.maskedAccountNumber,
    debitAccountName:
      debitAccount.accountName,

    beneficiaryId: beneficiary.id,
    beneficiaryName:
      beneficiary.beneficiaryName,
    beneficiaryAccountNumber:
      beneficiary.accountNumber,
    maskedBeneficiaryAccountNumber:
      beneficiary.maskedAccountNumber ||
      maskPaymentAccountNumber(
        beneficiary.accountNumber,
      ),
    beneficiaryBankName:
      beneficiary.bankName,
    beneficiaryIfscCode:
      beneficiary.ifscCode,

    amount: input.amount,
    currency: input.currency,

    paymentPurpose: input.paymentPurpose,
    remarks: input.remarks,
    customerReference:
      input.customerReference,
    invoiceReference:
      input.invoiceReference,

    scheduledDate: input.scheduledDate,

    status: "PENDING_AUTHORISATION",

    createdByUserId:
      input.createdByUserId,
    createdByName: input.createdByName,
    createdAt: now,
    submittedAt: now,

    appliedMopId: applicableMop.id,
    appliedMopVersion:
      applicableMop.version,

    currentApprovalStageSequence:
      applicableMop.stages[0].sequence,

    totalApprovalStages:
      applicableMop.stages.length,
  };

  const approvalStages =
  createApprovalStagesFromMop(
    payment.id,
    payment.paymentReference,
    payment.organisationId,
    "PAYMENT",
    applicableMop,
  );

  updateMockDatabase((updatedDatabase) => {
    updatedDatabase.payments.push(payment);

    updatedDatabase.approvalStages.push(
      ...approvalStages,
    );
  });

  return {
    payment,
    appliedMop: applicableMop,
    message:
      "Transaction submitted for approval.",
  };
}
