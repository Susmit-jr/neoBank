import type {
  Payment,
  PaymentProcessingEvent,
} from "../types/payment";

import {
  getMockDatabase,
  updateMockDatabase,
} from "./mockDatabase";

export type PaymentProcessingOutcome =
  | "SUCCESSFUL"
  | "FAILED";

export type ProcessPaymentInput = {
  paymentId: string;
  outcome: PaymentProcessingOutcome;
  failureCode?: string;
  failureReason?: string;
};

export type ProcessPaymentResult = {
  payment: Payment;
  message: string;
};

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function generateBankTransactionReference(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = Math.floor(
    100000 + Math.random() * 900000,
  );

  return `BANKTXN-${datePart}-${randomPart}`;
}

function generateUtrNumber(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = Math.floor(
    10000000 + Math.random() * 90000000,
  );

  return `UTR${datePart}${randomPart}`;
}

function createProcessingEvent(
  payment: Payment,
  status: PaymentProcessingEvent["status"],
  additionalFields?: Partial<PaymentProcessingEvent>,
): PaymentProcessingEvent {
  return {
    id: crypto.randomUUID(),

    paymentId: payment.id,
    paymentReference: payment.paymentReference,

    status,
    eventTime: new Date().toISOString(),

    ...additionalFields,
  };
}

export async function getAuthorisedPayments(): Promise<
  Payment[]
> {
  await delay(300);

  const database = getMockDatabase();

  return database.payments
    .filter(
      (payment) => payment.status === "AUTHORISED",
    )
    .sort(
      (first, second) =>
        new Date(
          second.authorisedAt ??
            second.submittedAt ??
            second.createdAt,
        ).getTime() -
        new Date(
          first.authorisedAt ??
            first.submittedAt ??
            first.createdAt,
        ).getTime(),
    );
}

export async function processAuthorisedPayment(
  input: ProcessPaymentInput,
): Promise<ProcessPaymentResult> {
  const database = getMockDatabase();

  const payment = database.payments.find(
    (item) => item.id === input.paymentId,
  );

  if (!payment) {
    throw new Error(
      "The payment instruction could not be found.",
    );
  }

  if (payment.status !== "AUTHORISED") {
    throw new Error(
      "Only an authorised payment can be submitted for processing.",
    );
  }

  if (
    input.outcome === "FAILED" &&
    !input.failureReason?.trim()
  ) {
    throw new Error(
      "A failure reason is required for failed payment processing.",
    );
  }

  const bankTransactionReference =
    generateBankTransactionReference();

  /*
   * Stage 1: payment submitted to bank processing.
   */
  updateMockDatabase((updatedDatabase) => {
    const storedPayment =
      updatedDatabase.payments.find(
        (item) => item.id === input.paymentId,
      );

    if (!storedPayment) {
      throw new Error(
        "The payment instruction could not be found.",
      );
    }

    storedPayment.status = "PROCESSING";
    storedPayment.processingStartedAt =
      new Date().toISOString();

    storedPayment.bankTransactionReference =
      bankTransactionReference;

    updatedDatabase.paymentProcessingEvents.push(
      createProcessingEvent(
        storedPayment,
        "SUBMITTED_TO_BANK",
        {
          bankTransactionReference,
        },
      ),
    );
  });

  await delay(600);

  /*
   * Stage 2: bank validation started.
   */
  updateMockDatabase((updatedDatabase) => {
    const storedPayment =
      updatedDatabase.payments.find(
        (item) => item.id === input.paymentId,
      );

    if (!storedPayment) {
      throw new Error(
        "The payment instruction could not be found.",
      );
    }

    updatedDatabase.paymentProcessingEvents.push(
      createProcessingEvent(
        storedPayment,
        "VALIDATION_IN_PROGRESS",
        {
          bankTransactionReference,
        },
      ),
    );
  });

  await delay(600);

  /*
   * Failed-processing outcome.
   */
  if (input.outcome === "FAILED") {
    const failureCode =
      input.failureCode?.trim() ||
      "BANK_PROCESSING_FAILED";

    const failureReason =
      input.failureReason?.trim() ||
      "The payment could not be processed.";

    let failedPayment: Payment | undefined;

    updateMockDatabase((updatedDatabase) => {
      const storedPayment =
        updatedDatabase.payments.find(
          (item) => item.id === input.paymentId,
        );

      if (!storedPayment) {
        throw new Error(
          "The payment instruction could not be found.",
        );
      }

      storedPayment.status = "FAILED";
      storedPayment.failedAt =
        new Date().toISOString();

      storedPayment.failureReason =
        failureReason;

      updatedDatabase.paymentProcessingEvents.push(
        createProcessingEvent(
          storedPayment,
          "FAILED",
          {
            bankTransactionReference,
            failureCode,
            failureReason,
          },
        ),
      );

      failedPayment =
        structuredClone(storedPayment);
    });

    if (!failedPayment) {
      throw new Error(
        "The failed payment result could not be determined.",
      );
    }

    return {
      payment: failedPayment,
      message: `Transaction failed: ${failureReason}`,
    };
  }

  /*
   * Stage 3: payment accepted by the bank.
   */
  updateMockDatabase((updatedDatabase) => {
    const storedPayment =
      updatedDatabase.payments.find(
        (item) => item.id === input.paymentId,
      );

    if (!storedPayment) {
      throw new Error(
        "The payment instruction could not be found.",
      );
    }

    updatedDatabase.paymentProcessingEvents.push(
      createProcessingEvent(
        storedPayment,
        "ACCEPTED",
        {
          bankTransactionReference,
        },
      ),
    );
  });

  await delay(600);

  /*
   * Stage 4: payment processing.
   */
  updateMockDatabase((updatedDatabase) => {
    const storedPayment =
      updatedDatabase.payments.find(
        (item) => item.id === input.paymentId,
      );

    if (!storedPayment) {
      throw new Error(
        "The payment instruction could not be found.",
      );
    }

    updatedDatabase.paymentProcessingEvents.push(
      createProcessingEvent(
        storedPayment,
        "PROCESSING",
        {
          bankTransactionReference,
        },
      ),
    );
  });

  await delay(600);

  /*
   * Stage 5: successful completion.
   */
  const utrNumber = generateUtrNumber();

  let successfulPayment: Payment | undefined;

  updateMockDatabase((updatedDatabase) => {
    const storedPayment =
      updatedDatabase.payments.find(
        (item) => item.id === input.paymentId,
      );

    if (!storedPayment) {
      throw new Error(
        "The payment instruction could not be found.",
      );
    }

    storedPayment.status = "SUCCESSFUL";
    storedPayment.completedAt =
      new Date().toISOString();

    storedPayment.bankTransactionReference =
      bankTransactionReference;

    storedPayment.utrNumber = utrNumber;

    const debitAccount = updatedDatabase.accounts.find(
      (item) => item.id === storedPayment.debitAccountId,
    );

    if (debitAccount) {
      debitAccount.availableBalance -= storedPayment.amount;
      debitAccount.ledgerBalance -= storedPayment.amount;

      updatedDatabase.transactions.push({
        id: crypto.randomUUID(),
        accountId: debitAccount.id,
        transactionReference: utrNumber,
        transactionDate: new Date().toISOString(),
        valueDate: new Date().toISOString().slice(0, 10),
        description: storedPayment.paymentPurpose,
        counterpartyName: storedPayment.beneficiaryName,
        type: "DEBIT",
        amount: storedPayment.amount,
        closingBalance: debitAccount.ledgerBalance,
        status: "SUCCESSFUL",
      });
    }

    updatedDatabase.paymentProcessingEvents.push(
      createProcessingEvent(
        storedPayment,
        "SUCCESSFUL",
        {
          bankTransactionReference,
          utrNumber,
        },
      ),
    );

    successfulPayment =
      structuredClone(storedPayment);
  });

  if (!successfulPayment) {
    throw new Error(
      "The successful payment result could not be determined.",
    );
  }

  return {
    payment: successfulPayment,
    message:
      "Transaction completed successfully.",
  };
}

// Called by neobank pages so processing continues after the bank popup closes.
// shortcut: always succeeds, replace with the bank's processing callback.
export async function processAllAuthorisedPayments(): Promise<number> {
  const authorised = await getAuthorisedPayments();

  for (const payment of authorised) {
    const debitAccount = getMockDatabase().accounts.find(
      (item) => item.id === payment.debitAccountId,
    );

    // shortcut: simulated bank rejections, replace with the bank's real response
    const failure =
      debitAccount && debitAccount.availableBalance < payment.amount
        ? {
            failureCode: "INSUFFICIENT_FUNDS",
            failureReason:
              "Insufficient funds in the debit account at the time of processing.",
          }
        : payment.beneficiaryAccountNumber.endsWith("0000")
          ? {
              failureCode: "BENEFICIARY_ACCOUNT_CLOSED",
              failureReason:
                "The beneficiary account is closed or invalid. Please verify the account details with the beneficiary.",
            }
          : undefined;

    try {
      await processAuthorisedPayment({
        paymentId: payment.id,
        outcome: failure ? "FAILED" : "SUCCESSFUL",
        ...failure,
      });
    } catch {
      // Already picked up by another page.
    }
  }

  return authorised.length;
}
