import type {
  AccountTransaction,
  BankAccount,
} from "../types/banking";
import { getMockDatabase } from "./mockDatabase";

function delay(milliseconds = 400) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
}

export async function getAccountsByOrganisation(
  organisationId: string,
): Promise<BankAccount[]> {
  await delay();

  const database = getMockDatabase();

  return database.accounts.filter(
    (account) =>
      account.organisationId === organisationId,
  );
}

export async function getAccountById(
  accountId: string,
): Promise<BankAccount | undefined> {
  await delay();

  const database = getMockDatabase();

  return database.accounts.find(
    (account) => account.id === accountId,
  );
}

export async function getTransactionsByOrganisation(
  organisationId: string,
): Promise<AccountTransaction[]> {
  await delay();

  const database = getMockDatabase();

  const organisationAccountIds = database.accounts
    .filter(
      (account) =>
        account.organisationId === organisationId,
    )
    .map((account) => account.id);

  return database.transactions
    .filter((transaction) =>
      organisationAccountIds.includes(
        transaction.accountId,
      ),
    )
    .sort(
      (first, second) =>
        new Date(second.transactionDate).getTime() -
        new Date(first.transactionDate).getTime(),
    );
}

export async function getTransactionsByAccount(
  accountId: string,
): Promise<AccountTransaction[]> {
  await delay();

  const database = getMockDatabase();

  return database.transactions
    .filter(
      (transaction) =>
        transaction.accountId === accountId,
    )
    .sort(
      (first, second) =>
        new Date(second.transactionDate).getTime() -
        new Date(first.transactionDate).getTime(),
    );
}

export async function getTotalAvailableBalance(
  organisationId: string,
): Promise<number> {
  const accounts = await getAccountsByOrganisation(
    organisationId,
  );

  return accounts.reduce(
    (total, account) =>
      total + account.availableBalance,
    0,
  );
}
