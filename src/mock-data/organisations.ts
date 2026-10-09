import type {
  MerchantOrganisation,
} from "../types/organisation";

export const mockMerchantOrganisations: MerchantOrganisation[] = [
  {
    id: "ORG-001",
    organisationReference: "ORG-REF-0001",
    legalName: "Acme Enterprises Private Limited",
    constitution: "PRIVATE_LIMITED_COMPANY",
    pan: "AAACA1234F",
    gstin: "27AAACA1234F1Z5",
    dateOfIncorporation: "2018-04-12",
    natureOfBusiness: "Industrial supplies and distribution",
    registeredAddress: "Unit 4, Andheri Industrial Estate, Mumbai 400093",
    corporateId: "ACME001",
    cifId: "7305182946",
    primaryAccountId: "ACC-001",
    enabledServices: [
      "CORPORATE_NET_BANKING",
      "PAYMENTS",
      "COLLECTIONS",
    ],
    status: "ACTIVE",
    onboardingApplicationId: "APP-SEED-001",
    onboardingApplicationReference: "ACCAPP-20260115-0001",
    createdAt: "2026-01-15T10:00:00.000Z",
    activatedAt: "2026-01-15T10:00:00.000Z",
    createdByUserId: "USR-PLATFORM-001",
    createdByName: "Platform Administrator",
  },
];
