import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAccountsByOrganisation,
  getTransactionsByOrganisation,
} from "../../services/accountService";
import { useAuth } from "../../store/AuthContext";
import type {
  AccountTransaction,
  BankAccount,
} from "../../types/banking";
import {
  formatCompactCurrency,
  formatCurrency,
} from "../../utils/currency";
import {
  formatDate,
  formatDateTime,
} from "../../utils/dates";

function AccountsPage() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<
    BankAccount[]
  >([]);

  const [transactions, setTransactions] =
    useState<AccountTransaction[]>([]);

  const [selectedAccountId, setSelectedAccountId] =
    useState("ALL");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const loadAccountData = useCallback(async () => {
    if (!user?.organisationId) {
      setAccounts([]);
      setTransactions([]);

      setError(
        "The current user is not linked to a merchant organisation.",
      );

      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const [accountData, transactionData] =
        await Promise.all([
          getAccountsByOrganisation(
            user.organisationId,
          ),

          getTransactionsByOrganisation(
            user.organisationId,
          ),
        ]);

      setAccounts(accountData);
      setTransactions(transactionData);

      setSelectedAccountId((currentSelection) => {
        if (currentSelection === "ALL") {
          return currentSelection;
        }

        const accountStillExists =
          accountData.some(
            (account) =>
              account.id === currentSelection,
          );

        return accountStillExists
          ? currentSelection
          : "ALL";
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The account information could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.organisationId]);

  useEffect(() => {
    void loadAccountData();
  }, [loadAccountData]);

  const totalAvailableBalance = accounts.reduce(
    (total, account) =>
      total + account.availableBalance,
    0,
  );

  const totalLedgerBalance = accounts.reduce(
    (total, account) =>
      total + account.ledgerBalance,
    0,
  );

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return transactions.filter((transaction) => {
      const matchesAccount =
        selectedAccountId === "ALL" ||
        transaction.accountId ===
          selectedAccountId;

      const matchesSearch =
        !normalizedSearch ||
        transaction.description
          .toLowerCase()
          .includes(normalizedSearch) ||
        transaction.counterpartyName
          .toLowerCase()
          .includes(normalizedSearch) ||
        transaction.transactionReference
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesAccount && matchesSearch;
    });
  }, [
    searchTerm,
    selectedAccountId,
    transactions,
  ]);

  function getAccount(accountId: string) {
    return accounts.find(
      (account) => account.id === accountId,
    );
  }

  function getAccountSummary(): string {
    if (accounts.length === 0) {
      return "No active account";
    }

    if (accounts.length === 1) {
      return "Primary current account";
    }

    return `${accounts.length} active accounts`;
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl">
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-slate-500"
            />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading accounts and transactions...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Account management
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-950">
            Accounts and balances
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            View your account balance, account details and
            recent transaction activity.
          </p>
        </div>

        <div className="flex gap-3">
        <button
          type="button"
          onClick={() =>
            void loadAccountData()
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

        <Link
          to="/merchant/add-balance"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          Add balance
        </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <WalletCards size={21} />
          </div>

          <p className="mt-5 text-sm text-slate-300">
            Total available balance
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatCompactCurrency(
              totalAvailableBalance,
            )}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {getAccountSummary()}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Landmark size={21} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Total ledger balance
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {formatCompactCurrency(
              totalLedgerBalance,
            )}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Balance recorded against the account
          </p>
        </article>
      </div>

      {accounts.length > 0 ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {accounts.map((account) => (
            <article
              key={account.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">
                      {account.accountName}
                    </h3>

                    {account.isPrimary && (
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        Primary
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {account.accountType.replaceAll(
                      "_",
                      " ",
                    )}{" "}
                    ACCOUNT
                  </p>
                </div>

                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    account.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {account.status.replaceAll(
                    "_",
                    " ",
                  )}
                </span>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Available balance
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {formatCurrency(
                      account.availableBalance,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Ledger balance
                  </p>

                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {formatCurrency(
                      account.ledgerBalance,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="grid gap-5 text-sm sm:grid-cols-2">
                  <AccountDetail
                    label="Account number"
                    value={
                      account.maskedAccountNumber
                    }
                  />

                  <AccountDetail
                    label="IFSC"
                    value={account.ifscCode}
                  />

                  <AccountDetail
                    label="Branch"
                    value={account.branchName}
                  />

                  <AccountDetail
                    label="Currency"
                    value={account.currency}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <WalletCards
            size={32}
            className="mx-auto text-slate-300"
          />

          <p className="mt-4 font-semibold text-slate-900">
            No active account available
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Account information will appear after merchant
            onboarding is completed.
          </p>
        </div>
      )}

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Recent transactions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Latest account credits and debits
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {accounts.length > 1 && (
              <select
                value={selectedAccountId}
                onChange={(event) => {
                  setSelectedAccountId(
                    event.target.value,
                  );
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-500"
              >
                <option value="ALL">
                  All accounts
                </option>

                {accounts.map((account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.maskedAccountNumber}
                  </option>
                ))}
              </select>
            )}

            <label className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search transactions"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-500 sm:w-64"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Date",
                  "Transaction",
                  "Account",
                  "Reference",
                  "Amount",
                  "Status",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(
                (transaction) => {
                  const account = getAccount(
                    transaction.accountId,
                  );

                  const isCredit =
                    transaction.type === "CREDIT";

                  return (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(
                            transaction.transactionDate,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(
                            transaction.transactionDate,
                          )
                            .split(",")
                            .at(-1)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex min-w-56 items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              isCredit
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft
                                size={18}
                              />
                            ) : (
                              <ArrowUpRight
                                size={18}
                              />
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {
                                transaction.counterpartyName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                transaction.description
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {account?.maskedAccountNumber ??
                          "Not available"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-600">
                        {
                          transaction.transactionReference
                        }
                      </td>

                      <td
                        className={`whitespace-nowrap px-6 py-4 text-sm font-bold ${
                          isCredit
                            ? "text-emerald-700"
                            : "text-slate-950"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatCurrency(
                          transaction.amount,
                        )}
                      </td>


<td className="whitespace-nowrap px-6 py-4">
  <span
    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
      transaction.status === "SUCCESSFUL"
        ? "bg-emerald-50 text-emerald-700"
        : transaction.status === "PROCESSING"
          ? "bg-amber-50 text-amber-700"
          : "bg-red-50 text-red-700"
    }`}
  >
    {transaction.status.replaceAll("_", " ")}
  </span>
</td>

                    </tr>
                  );
                },
              )}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No transactions available
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Transactions will appear here after
                      account activity begins.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

type AccountDetailProps = {
  label: string;
  value: string;
};

function AccountDetail({
  label,
  value,
}: AccountDetailProps) {
  return (
    <div>
      <p className="text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-slate-900">
        {value || "Not available"}
      </p>
    </div>
  );
}

export default AccountsPage;
