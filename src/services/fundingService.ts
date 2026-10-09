import type { FundingRequest } from "../types/funding";
import { createApprovalStagesFromMop } from "./approvalService";
import { getMockDatabase, updateMockDatabase } from "./mockDatabase";
import { getApplicableMop } from "./mopService";

export const MIN_FUNDING_AMOUNT = 1000;
export const MAX_FUNDING_AMOUNT = 5000000;

export type LinkedSourceAccount = {
  id: string;
  name: string;
  bankName: string;
  maskedAccountNumber: string;
};

// shortcut: linked accounts are fixed samples, replace with the customer's own bank links.
export function getLinkedSourceAccounts(
  organisationName: string,
): LinkedSourceAccount[] {
  return [
    {
      id: "SRC-1",
      name: `${organisationName} (Operating)`,
      bankName: "ICICI Bank",
      maskedAccountNumber: "XXXXXX4012",
    },
    {
      id: "SRC-2",
      name: `${organisationName} (Collections)`,
      bankName: "HDFC Bank",
      maskedAccountNumber: "XXXXXX7788",
    },
  ];
}

function delay(milliseconds = 400) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export async function getFundingRequests(
  organisationId: string,
): Promise<FundingRequest[]> {
  await delay(250);

  return getMockDatabase()
    .fundingRequests.filter((item) => item.organisationId === organisationId)
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
}

export type CreateFundingInput = {
  organisationId: string;
  organisationName: string;
  creditAccountId: string;
  sourceAccountId: string;
  amount: number;
  remarks?: string;
  createdByUserId: string;
  createdByName: string;
};

export async function createFundingRequest(
  input: CreateFundingInput,
): Promise<FundingRequest> {
  await delay();

  if (!Number.isFinite(input.amount) || input.amount < MIN_FUNDING_AMOUNT) {
    throw new Error(
      `The minimum amount you can add is ₹${MIN_FUNDING_AMOUNT.toLocaleString("en-IN")}.`,
    );
  }

  if (input.amount > MAX_FUNDING_AMOUNT) {
    throw new Error(
      `You can add up to ₹${MAX_FUNDING_AMOUNT.toLocaleString("en-IN")} in one request.`,
    );
  }

  const database = getMockDatabase();

  const account = database.accounts.find(
    (item) =>
      item.id === input.creditAccountId &&
      item.organisationId === input.organisationId &&
      item.status === "ACTIVE",
  );

  if (!account) {
    throw new Error("Choose an active account to add money to.");
  }

  const source = getLinkedSourceAccounts(input.organisationName).find(
    (item) => item.id === input.sourceAccountId,
  );

  if (!source) {
    throw new Error("Choose the account to add money from.");
  }

  let mop;

  try {
    mop = await getApplicableMop(input.organisationId, "ADD_BALANCE");
  } catch {
    throw new Error("Adding balance is not set up for your company yet.");
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const datePart = now.slice(0, 10).replaceAll("-", "");

  const request: FundingRequest = {
    id,
    organisationId: input.organisationId,
    fundingReference: `FUND-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`,

    creditAccountId: account.id,
    maskedCreditAccountNumber: account.maskedAccountNumber,
    creditAccountName: account.accountName,

    sourceAccountName: source.name,
    maskedSourceAccountNumber: source.maskedAccountNumber,
    sourceBankName: source.bankName,

    amount: input.amount,
    currency: "INR",
    remarks: input.remarks?.trim() || undefined,

    status: "PENDING_AUTHORISATION",

    createdByUserId: input.createdByUserId,
    createdByName: input.createdByName,
    createdAt: now,
    submittedAt: now,

    appliedMopId: mop.id,
    appliedMopVersion: mop.version,
    currentApprovalStageSequence: mop.stages[0].sequence,
    totalApprovalStages: mop.stages.length,
  };

  const stages = createApprovalStagesFromMop(
    id,
    request.fundingReference,
    input.organisationId,
    "ADD_BALANCE",
    mop,
  );

  updateMockDatabase((updated) => {
    updated.fundingRequests.push(request);
    updated.approvalStages.push(...stages);
  });

  return request;
}

// Authorised requests are collected from the linked account and credited to the account.
// shortcut: always succeeds, replace with the bank's collection result.
export async function processAllAuthorisedFunding(): Promise<void> {
  const authorised = getMockDatabase().fundingRequests.filter(
    (item) => item.status === "AUTHORISED",
  );

  for (const request of authorised) {
    let claimed = false;

    updateMockDatabase((database) => {
      const stored = database.fundingRequests.find(
        (item) => item.id === request.id,
      );

      if (stored && stored.status === "AUTHORISED") {
        stored.status = "PROCESSING";
        stored.processingStartedAt = new Date().toISOString();
        claimed = true;
      }
    });

    if (!claimed) {
      continue;
    }

    await delay(1800);

    updateMockDatabase((database) => {
      const stored = database.fundingRequests.find(
        (item) => item.id === request.id,
      );
      const account = database.accounts.find(
        (item) => item.id === request.creditAccountId,
      );

      if (!stored || !account) {
        return;
      }

      const completedAt = new Date().toISOString();
      const bankReference = `FUNDTXN-${completedAt.slice(0, 10).replaceAll("-", "")}-${Math.floor(100000 + Math.random() * 900000)}`;

      account.availableBalance += stored.amount;
      account.ledgerBalance += stored.amount;

      database.transactions.push({
        id: crypto.randomUUID(),
        accountId: account.id,
        transactionReference: bankReference,
        transactionDate: completedAt,
        valueDate: completedAt.slice(0, 10),
        description: "Funds added",
        counterpartyName: `${stored.sourceBankName} ${stored.maskedSourceAccountNumber}`,
        type: "CREDIT",
        amount: stored.amount,
        closingBalance: account.ledgerBalance,
        status: "SUCCESSFUL",
      });

      stored.status = "SUCCESSFUL";
      stored.completedAt = completedAt;
      stored.bankReference = bankReference;
    });
  }
}
