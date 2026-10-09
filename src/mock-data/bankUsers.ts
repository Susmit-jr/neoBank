export type MockBankUser = {
  id: string;
  corporateId: string;
  bankUserId: string;
  password: string;

  organisationId: string;
  platformUserId: string;

  fullName: string;
  isActive: boolean;
};

export const mockBankUsers: MockBankUser[] = [
  {
    id: "BANK-USR-001",
    corporateId: "ACME001",
    bankUserId: "bankchecker01",
    password: "BankChecker@123",

    organisationId: "ORG-001",
    platformUserId: "USR-MERCHANT-003",

    fullName: "Rohan Verma",
    isActive: true,
  },
  {
    id: "BANK-USR-002",
    corporateId: "ACME001",
    bankUserId: "bankchecker02",
    password: "BankChecker@123",

    organisationId: "ORG-001",
    platformUserId: "USR-MERCHANT-004",

    fullName: "Priya Nair",
    isActive: true,
  },
];
