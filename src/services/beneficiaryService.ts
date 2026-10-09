import type {
  Beneficiary,
  BeneficiaryAccountType,
} from "../types/banking";
import type { ModeOfOperation } from "../types/approval";
import { createApprovalStagesFromMop } from "./approvalService";
import {
  getMockDatabase,
  updateMockDatabase,
} from "./mockDatabase";
import { getApplicableMop } from "./mopService";

function delay(milliseconds = 400) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export type CreateBeneficiaryInput = {
  organisationId: string;

  beneficiaryCode: string;
  beneficiaryName: string;

  accountNumber: string;
  accountType: BeneficiaryAccountType;

  bankName: string;
  branchName: string;
  ifscCode: string;

  email?: string;
  mobileNumber?: string;

  createdByUserId: string;
  createdByName: string;
};

export type DuplicateBeneficiaryResult = {
  isDuplicate: boolean;
  message?: string;
};

export type CreateBeneficiaryResult = {
  beneficiary: Beneficiary;
  appliedMop: ModeOfOperation;
};

function maskAccountNumber(accountNumber: string): string {
  const visibleDigits = accountNumber.slice(-4);
  const hiddenLength = Math.max(
    accountNumber.length - visibleDigits.length,
    4,
  );

  return `${"X".repeat(hiddenLength)}${visibleDigits}`;
}

function generateBeneficiaryReference(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `BENREF-${datePart}-${randomPart}`;
}

function normalizeText(value: string): string {
  return value.trim().toUpperCase();
}

export async function getBeneficiariesByOrganisation(
  organisationId: string,
): Promise<Beneficiary[]> {
  await delay();

  const database = getMockDatabase();

  return database.beneficiaries
    .filter(
      (beneficiary) =>
        beneficiary.organisationId === organisationId,
    )
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
}

export async function getBeneficiaryById(
  beneficiaryId: string,
): Promise<Beneficiary | undefined> {
  await delay();

  const database = getMockDatabase();

  return database.beneficiaries.find(
    (beneficiary) => beneficiary.id === beneficiaryId,
  );
}

export async function checkDuplicateBeneficiary(
  organisationId: string,
  accountNumber: string,
  ifscCode: string,
): Promise<DuplicateBeneficiaryResult> {
  await delay(250);

  const database = getMockDatabase();

  const normalizedAccountNumber =
    accountNumber.trim().replaceAll(" ", "");

  const normalizedIfscCode = normalizeText(ifscCode);

  const duplicate = database.beneficiaries.find(
    (beneficiary) =>
      beneficiary.organisationId === organisationId &&
      beneficiary.accountNumber ===
        normalizedAccountNumber &&
      normalizeText(beneficiary.ifscCode) ===
        normalizedIfscCode &&
      beneficiary.status !== "REJECTED",
  );

  if (!duplicate) {
    return {
      isDuplicate: false,
    };
  }

  return {
    isDuplicate: true,
    message: `This beneficiary already exists with reference ${duplicate.beneficiaryReference} and status ${duplicate.status.replaceAll(
      "_",
      " ",
    )}.`,
  };
}

export async function createBeneficiary(
  input: CreateBeneficiaryInput,
): Promise<CreateBeneficiaryResult> {
  await delay(500);

  const duplicateResult =
    await checkDuplicateBeneficiary(
      input.organisationId,
      input.accountNumber,
      input.ifscCode,
    );

  if (duplicateResult.isDuplicate) {
    throw new Error(
      duplicateResult.message ??
        "A duplicate beneficiary already exists.",
    );
  }

  const applicableMop = await getApplicableMop(
    input.organisationId,
    "BENEFICIARY_CREATION",
  );

  const now = new Date().toISOString();
  const beneficiaryId = crypto.randomUUID();
  const beneficiaryReference =
    generateBeneficiaryReference();

  const beneficiary: Beneficiary = {
    id: beneficiaryId,
    organisationId: input.organisationId,

    beneficiaryReference,
    beneficiaryCode: normalizeText(
      input.beneficiaryCode,
    ),
    beneficiaryName: input.beneficiaryName.trim(),

    accountNumber: input.accountNumber
      .trim()
      .replaceAll(" ", ""),
    maskedAccountNumber: maskAccountNumber(
      input.accountNumber.trim().replaceAll(" ", ""),
    ),
    accountType: input.accountType,

    bankName: input.bankName.trim(),
    branchName: input.branchName.trim(),
    ifscCode: normalizeText(input.ifscCode),

    email: input.email?.trim() || undefined,
    mobileNumber:
      input.mobileNumber?.trim() || undefined,

    status: "PENDING_AUTHORISATION",

    createdByUserId: input.createdByUserId,
    createdByName: input.createdByName,
    createdAt: now,
    submittedAt: now,

    appliedMopId: applicableMop.id,
    appliedMopVersion: applicableMop.version,

    currentApprovalStageSequence:
      applicableMop.stages[0].sequence,
    totalApprovalStages: applicableMop.stages.length,

    totalPayments: 0,
  };

  const approvalStages = createApprovalStagesFromMop(
    beneficiary.id,
    beneficiary.beneficiaryReference,
    beneficiary.organisationId,
    "BENEFICIARY_CREATION",
    applicableMop,
  );

  updateMockDatabase((database) => {
    database.beneficiaries.push(beneficiary);
    database.approvalStages.push(...approvalStages);
  });

  return {
    beneficiary,
    appliedMop: applicableMop,
  };
}
