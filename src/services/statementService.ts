import type { AccountTransaction, BankAccount } from "../types/banking";
import { getMockDatabase } from "./mockDatabase";

export type StatementLine = AccountTransaction & {
  balanceAfter: number;
};

export type Statement = {
  account: BankAccount;
  cifId: string;
  from: string;
  to: string;
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  closingBalance: number;
  lines: StatementLine[];
};

const dayStart = (value: string) => new Date(`${value}T00:00:00`).getTime();
const dayEnd = (value: string) => new Date(`${value}T23:59:59.999`).getTime();

// Running balances are rebuilt backwards from the live ledger balance so the statement
// always agrees with the account, whatever the stored closing balances say.
export function buildStatement(
  accountId: string,
  from: string,
  to: string,
): Statement | undefined {
  const database = getMockDatabase();
  const account = database.accounts.find((item) => item.id === accountId);

  if (!account) {
    return undefined;
  }

  const ascending = database.transactions
    .filter((item) => item.accountId === accountId && item.status === "SUCCESSFUL")
    .sort(
      (first, second) =>
        new Date(first.transactionDate).getTime() -
        new Date(second.transactionDate).getTime(),
    );

  let balance = account.ledgerBalance;
  const withBalance: (StatementLine & { before: number })[] = [];

  for (let index = ascending.length - 1; index >= 0; index -= 1) {
    const item = ascending[index];
    const before =
      item.type === "CREDIT" ? balance - item.amount : balance + item.amount;

    withBalance.unshift({ ...item, balanceAfter: balance, before });
    balance = before;
  }

  const start = dayStart(from);
  const end = dayEnd(to);

  const inRange = withBalance.filter((item) => {
    const time = new Date(item.transactionDate).getTime();
    return time >= start && time <= end;
  });

  const priorLines = withBalance.filter(
    (item) => new Date(item.transactionDate).getTime() < start,
  );

  const openingBalance =
    priorLines.length > 0
      ? priorLines[priorLines.length - 1].balanceAfter
      : (withBalance[0]?.before ?? account.ledgerBalance);

  const totalCredits = inRange
    .filter((item) => item.type === "CREDIT")
    .reduce((total, item) => total + item.amount, 0);
  const totalDebits = inRange
    .filter((item) => item.type === "DEBIT")
    .reduce((total, item) => total + item.amount, 0);

  return {
    account,
    cifId:
      database.organisations.find((item) => item.id === account.organisationId)
        ?.cifId ?? "-",
    from,
    to,
    openingBalance,
    totalCredits,
    totalDebits,
    closingBalance: openingBalance + totalCredits - totalDebits,
    lines: inRange.map((item) => ({
      ...item,
      balanceAfter: item.balanceAfter,
    })),
  };
}

export function statementToCsv(statement: Statement): string {
  const escape = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;

  const rows = [
    ["Date", "Description", "Counterparty", "Reference", "Debit", "Credit", "Balance"],
    ...statement.lines.map((line) => [
      line.transactionDate.slice(0, 10),
      line.description,
      line.counterpartyName,
      line.transactionReference,
      line.type === "DEBIT" ? line.amount : "",
      line.type === "CREDIT" ? line.amount : "",
      line.balanceAfter,
    ]),
  ];

  return [
    `Account statement,${escape(statement.account.accountName)}`,
    `Account number,${escape(statement.account.accountNumber)}`,
    `CIF ID,${escape(statement.cifId)}`,
    `Period,${statement.from} to ${statement.to}`,
    `Opening balance,${statement.openingBalance}`,
    "",
    ...rows.map((row) => row.map(escape).join(",")),
    "",
    `Total credits,${statement.totalCredits}`,
    `Total debits,${statement.totalDebits}`,
    `Closing balance,${statement.closingBalance}`,
  ].join("\n");
}
