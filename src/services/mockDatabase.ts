import { mockAccounts } from "../mock-data/accounts";
import { mockTransactions } from "../mock-data/transactions";
import { mockBeneficiaries } from "../mock-data/beneficiaries";
import type { MockDatabase } from "../types/common";

import { mockUsers } from "../mock-data/users";

import {
  mockAccountOpeningApplications,
} from "../mock-data/onboardingApplications";

import {
  mockPayments,
  mockPaymentProcessingEvents,
} from "../mock-data/payments";

import {
  mockMerchantOrganisations,
} from "../mock-data/organisations";

const DATABASE_STORAGE_KEY = "neobank_mock_database";
const DATABASE_VERSION = 7;

const emptyDatabase: MockDatabase = {
  users: [...mockUsers],
  organisations: [
  ...mockMerchantOrganisations,
],
  version: DATABASE_VERSION,
  accounts: [...mockAccounts],
  transactions: [...mockTransactions],
  beneficiaries: [...mockBeneficiaries],
  approvalStages: [],
  approvalDecisions: [],
  bankAuthorisationSessions: [],
  payments: [...mockPayments],
  paymentProcessingEvents: [  ...mockPaymentProcessingEvents,],
  accountOpeningApplications: [...mockAccountOpeningApplications,],
};

function cloneDatabase(
  database: MockDatabase,
): MockDatabase {
  return structuredClone(database);
}

export function createInitialDatabase(): MockDatabase {
  return cloneDatabase(emptyDatabase);
}

export function getMockDatabase(): MockDatabase {
  const storedDatabase = localStorage.getItem(
    DATABASE_STORAGE_KEY,
  );

  if (!storedDatabase) {
    const initialDatabase = createInitialDatabase();

    saveMockDatabase(initialDatabase);

    return initialDatabase;
  }

  try {
    const parsedDatabase = JSON.parse(
      storedDatabase,
    ) as MockDatabase;

    if (
      !parsedDatabase.version ||
      parsedDatabase.version !== DATABASE_VERSION
    ) {
      const initialDatabase = createInitialDatabase();

      saveMockDatabase(initialDatabase);

      return initialDatabase;
    }

    return parsedDatabase;
  } catch {
    const initialDatabase = createInitialDatabase();

    saveMockDatabase(initialDatabase);

    return initialDatabase;
  }
}

export function saveMockDatabase(
  database: MockDatabase,
): void {
  localStorage.setItem(
    DATABASE_STORAGE_KEY,
    JSON.stringify(database),
  );
}

export function updateMockDatabase(
  updater: (database: MockDatabase) => void,
): MockDatabase {
  const database = getMockDatabase();
  const updatedDatabase = cloneDatabase(database);

  updater(updatedDatabase);

  saveMockDatabase(updatedDatabase);

  return updatedDatabase;
}

export function resetMockDatabase(): MockDatabase {
  const initialDatabase = createInitialDatabase();

  saveMockDatabase(initialDatabase);

  return initialDatabase;
}
