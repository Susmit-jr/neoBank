import type {
  BankingService,
  OrganisationConstitution,
} from "./onboarding";

export type MerchantOrganisationStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

export type MerchantOrganisation = {
  id: string;

  organisationReference: string;
  legalName: string;

  constitution: OrganisationConstitution;

  pan: string;
  gstin: string;

  dateOfIncorporation: string;
  natureOfBusiness: string;
  registeredAddress: string;

  corporateId: string;

  primaryAccountId: string;
  enabledServices: BankingService[];

  status: MerchantOrganisationStatus;

  onboardingApplicationId: string;
  onboardingApplicationReference: string;

  createdAt: string;
  activatedAt: string;

  createdByUserId: string;
  createdByName: string;
};
