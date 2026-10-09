import type {
  AccountApplicationType,
  AccountOpeningApplication,
  AuthorisedSignatory,
  OnboardingDocument,
  ProposedMopRule,
  ProposedNeoBankUser,
} from "../types/onboarding";

import {
  getMockDatabase,
  updateMockDatabase,
} from "./mockDatabase";

import type {
  MerchantOrganisation,
} from "../types/organisation";

import type {
  MockUser,
  UserRole,
} from "../types/auth";

function delay(milliseconds = 300) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function generateOrganisationReference(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `ORG-${datePart}-${randomPart}`;
}

function generateApplicationReference(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `ACCAPP-${datePart}-${randomPart}`;
}

function generateMockPan(): string {
  const randomNumber = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `AABCA${randomNumber}K`;
}

function generateMockGstin(): string {
  const randomNumber = Math.floor(
    1000 + Math.random() * 9000,
  );

  return `27AABCA${randomNumber}K1Z5`;
}

function generateMockAccountNumber(): string {
  return String(
    Math.floor(
      100000000000 + Math.random() * 900000000000,
    ),
  );
}

export type CreateOnboardingDraftInput = {
  applicationType: AccountApplicationType;

  applicantName?: string;
  applicantEmail?: string;
  applicantMobile?: string;
};

export function createEmptyOnboardingApplication(
  input: CreateOnboardingDraftInput,
): AccountOpeningApplication {
  const now = new Date().toISOString();

  const application: AccountOpeningApplication = {
    id: crypto.randomUUID(),
    applicationReference:
      generateApplicationReference(),

    type: input.applicationType,
    status: "DRAFT",

    applicant: {
      fullName: input.applicantName ?? "",
      workEmail: input.applicantEmail ?? "",
      mobileNumber: input.applicantMobile ?? "",
      designation: "",
    },

    organisation: {
      legalName: "",
      constitution: "PRIVATE_LIMITED_COMPANY",

      pan: "",
      gstin: "",

      dateOfIncorporation: "",
      natureOfBusiness: "",

      registeredAddress: "",
    },

    authorisedSignatories: [],
    proposedNeoBankUsers: [],
    proposedMopRules: [],

    documents: [],

    declarationAccepted: false,

    createdAt: now,
    updatedAt: now,

    neoBankReview: {
      status: "NOT_STARTED",
    },

    bankReview: {
      status: "NOT_STARTED",
    },
  };

  if (input.applicationType === "OPEN_NEW_ACCOUNT") {
    application.newAccountRequirement = {
      accountType: "CURRENT_ACCOUNT",
      preferredBranch: "",
      requestedServices: [
        "CORPORATE_NET_BANKING",
        "PAYMENTS",
      ],
    };
  }

  if (
    input.applicationType ===
    "CONNECT_EXISTING_ACCOUNT"
  ) {
    application.existingAccountRequirement = {
      accountNumber: "",
      corporateId: "",
      accountName: "",
      ifscCode: "",
      requestedServices: [
        "CORPORATE_NET_BANKING",
        "PAYMENTS",
      ],
    };
  }

  return application;
}

export async function createOnboardingDraft(
  input: CreateOnboardingDraftInput,
): Promise<AccountOpeningApplication> {
  await delay();

  const application =
    createEmptyOnboardingApplication(input);

  updateMockDatabase((database) => {
    database.accountOpeningApplications.push(
      application,
    );
  });

  return structuredClone(application);
}

export async function getOnboardingApplicationById(
  applicationId: string,
): Promise<AccountOpeningApplication | undefined> {
  await delay();

  const database = getMockDatabase();

  const application =
    database.accountOpeningApplications.find(
      (item) => item.id === applicationId,
    );

  return application
    ? structuredClone(application)
    : undefined;
}

export async function getOnboardingApplications(): Promise<
  AccountOpeningApplication[]
> {
  await delay();

  const database = getMockDatabase();

  return [...database.accountOpeningApplications]
    .sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime(),
    )
    .map((application) =>
      structuredClone(application),
    );
}

export async function saveOnboardingDraft(
  application: AccountOpeningApplication,
): Promise<AccountOpeningApplication> {
  await delay();

  if (application.status !== "DRAFT") {
    throw new Error(
      "Only a draft application can be edited.",
    );
  }

  const updatedApplication: AccountOpeningApplication = {
    ...structuredClone(application),
    updatedAt: new Date().toISOString(),
  };

  updateMockDatabase((database) => {
    const applicationIndex =
      database.accountOpeningApplications.findIndex(
        (item) =>
          item.id === updatedApplication.id,
      );

    if (applicationIndex === -1) {
      throw new Error(
        "The account-opening application could not be found.",
      );
    }

    database.accountOpeningApplications[
      applicationIndex
    ] = updatedApplication;
  });

  return structuredClone(updatedApplication);
}

export function generateMockOnboardingValues(
  application: AccountOpeningApplication,
): AccountOpeningApplication {
  if (application.status !== "DRAFT") {
    throw new Error(
      "Mock values can be added only to a draft application.",
    );
  }

  const applicationSuffix =
  application.applicationReference
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toLowerCase();

const mockEmail = (
  name: string,
): string => {
  return `${name}.${applicationSuffix}@acmedemo.in`;
};
  const signatoryOneId = crypto.randomUUID();
  const signatoryTwoId = crypto.randomUUID();

  const corporateAdminId = crypto.randomUUID();
  const makerId = crypto.randomUUID();
  const checkerOneId = crypto.randomUUID();
  const checkerTwoId = crypto.randomUUID();

  const authorisedSignatories: AuthorisedSignatory[] = [
    {
      id: signatoryOneId,

      fullName: "Arjun Mehta",
      designation: "Chief Financial Officer",

      email: mockEmail("arjun.mehta"),
      mobileNumber: "9876501001",
      pan: "AAMPM1234K",

      authority: "BOTH",

      transactionLimit: 10000000,
    },
    {
      id: signatoryTwoId,

      fullName: "Priya Nair",
      designation: "Finance Director",

      email: mockEmail("priya.nair"),
      mobileNumber: "9876501002",
      pan: "AANPN5678L",

      authority: "BANKING_TRANSACTIONS",

      transactionLimit: 5000000,
    },
  ];

  const proposedNeoBankUsers: ProposedNeoBankUser[] = [
    {
      id: corporateAdminId,

      fullName: "Arjun Mehta",
      email: mockEmail("arjun.mehta"),
      mobileNumber: "9876501001",

      role: "CORPORATE_ADMIN",

      linkedSignatoryId: signatoryOneId,
    },
    {
      id: makerId,

      fullName: "Neha Sharma",
      email: mockEmail("neha.sharma"),
      mobileNumber: "9876501003",

      role: "MAKER",
    },
    {
      id: checkerOneId,

      fullName: "Arjun Mehta",
      email: mockEmail("arjun.mehta"),
      mobileNumber: "9876501001",

      role: "CHECKER",

      linkedSignatoryId: signatoryOneId,
    },
    {
      id: checkerTwoId,

      fullName: "Priya Nair",
      email: mockEmail("priya.nair"),
      mobileNumber: "9876501002",

      role: "CHECKER",

      linkedSignatoryId: signatoryTwoId,
    },
  ];

  const proposedMopRules: ProposedMopRule[] = [
    {
      id: crypto.randomUUID(),

      operationType: "BENEFICIARY_CREATION",

      stages: [
        {
          id: crypto.randomUUID(),

          sequence: 1,
          stageName: "Beneficiary Authorisation",

          requiredApprovals: 1,

          eligibleNeoBankUserIds: [
            checkerOneId,
            checkerTwoId,
          ],
        },
      ],
    },
    {
      id: crypto.randomUUID(),

      operationType: "PAYMENT",

      minimumAmount: 0,
      maximumAmount: 5000000,

      stages: [
        {
          id: crypto.randomUUID(),

          sequence: 1,
          stageName: "Payment Authorisation",

          requiredApprovals: 1,

          eligibleNeoBankUserIds: [
            checkerOneId,
            checkerTwoId,
          ],
        },
      ],
    },
  ];

  const documents: OnboardingDocument[] = [
    {
      id: crypto.randomUUID(),

      documentType: "PAN",
      fileName: "company_pan_mock.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType: "GST_CERTIFICATE",
      fileName: "gst_certificate_mock.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType: "INCORPORATION_DOCUMENT",
      fileName:
        "certificate_of_incorporation_mock.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType: "BOARD_RESOLUTION",
      fileName: "board_resolution_mock.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType:
        "AUTHORISED_SIGNATORY_DOCUMENT",

      fileName:
        "authorised_signatory_mock.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
  ];

  const mockApplication: AccountOpeningApplication = {
    ...structuredClone(application),

    applicant: {
      fullName:
        application.applicant.fullName ||
        "Karan Malhotra",

      workEmail:
        application.applicant.workEmail ||
        mockEmail("karan.malhotra"),

      mobileNumber:
        application.applicant.mobileNumber ||
        "9876501000",

      designation: "Finance Manager",
    },

    organisation: {
      legalName:
        "Acme Digital Commerce Private Limited",

      constitution:
        "PRIVATE_LIMITED_COMPANY",

      pan: generateMockPan(),
      gstin: generateMockGstin(),

      dateOfIncorporation: "2021-04-15",

      natureOfBusiness:
        "Digital commerce and technology services",

      registeredAddress:
        "8th Floor, Business Park, Lower Parel, Mumbai, Maharashtra 400013",
    },

    authorisedSignatories,
    proposedNeoBankUsers,
    proposedMopRules,

    documents,

    declarationAccepted: true,
    declarationAcceptedAt:
      new Date().toISOString(),

    updatedAt: new Date().toISOString(),
  };

  if (
    mockApplication.type ===
    "OPEN_NEW_ACCOUNT"
  ) {
    mockApplication.newAccountRequirement = {
      accountType: "CURRENT_ACCOUNT",

      preferredBranch:
        "Mumbai Corporate Branch",

      requestedServices: [
        "CORPORATE_NET_BANKING",
        "PAYMENTS",
        "COLLECTIONS",
        "BULK_PAYMENTS",
        "API_BANKING",
      ],
    };

    mockApplication.existingAccountRequirement =
      undefined;
  }

  if (
    mockApplication.type ===
    "CONNECT_EXISTING_ACCOUNT"
  ) {
    mockApplication.existingAccountRequirement = {
      accountNumber:
        generateMockAccountNumber(),

      corporateId: "ACME-CORP-001",

      accountName:
        "Acme Digital Commerce Private Limited",

      ifscCode: "BANK0000123",

      requestedServices: [
        "CORPORATE_NET_BANKING",
        "PAYMENTS",
        "COLLECTIONS",
        "API_BANKING",
      ],
    };

    mockApplication.newAccountRequirement =
      undefined;
  }

  return mockApplication;
}

export type OnboardingValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type SubmitOnboardingResult = {
  application: AccountOpeningApplication;
  message: string;
};

export function validateOnboardingApplication(
  application: AccountOpeningApplication,
): OnboardingValidationResult {
  const errors: string[] = [];

  if (application.status !== "DRAFT") {
    errors.push(
      "Only a draft application can be submitted.",
    );
  }

  if (!application.applicant.fullName.trim()) {
    errors.push("Applicant full name is required.");
  }

  if (!application.applicant.workEmail.trim()) {
    errors.push("Applicant work email is required.");
  }

  if (
    application.applicant.workEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      application.applicant.workEmail,
    )
  ) {
    errors.push(
      "Enter a valid applicant work email.",
    );
  }

  if (
    !/^[6-9]\d{9}$/.test(
      application.applicant.mobileNumber.trim(),
    )
  ) {
    errors.push(
      "Enter a valid 10-digit applicant mobile number.",
    );
  }

  if (!application.applicant.designation.trim()) {
    errors.push("Applicant designation is required.");
  }

  if (!application.organisation.legalName.trim()) {
    errors.push(
      "Legal organisation name is required.",
    );
  }

  if (
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
      application.organisation.pan
        .trim()
        .toUpperCase(),
    )
  ) {
    errors.push("Enter a valid organisation PAN.");
  }

  if (
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(
      application.organisation.gstin
        .trim()
        .toUpperCase(),
    )
  ) {
    errors.push("Enter a valid GSTIN.");
  }

  if (
    !application.organisation.dateOfIncorporation
  ) {
    errors.push(
      "Date of incorporation is required.",
    );
  }

  if (
    !application.organisation.natureOfBusiness.trim()
  ) {
    errors.push(
      "Nature of business is required.",
    );
  }

  if (
    !application.organisation.registeredAddress.trim()
  ) {
    errors.push(
      "Registered address is required.",
    );
  }

  if (
    application.type === "OPEN_NEW_ACCOUNT"
  ) {
    const requirement =
      application.newAccountRequirement;

    if (!requirement) {
      errors.push(
        "New-account requirements are missing.",
      );
    } else {
      if (!requirement.preferredBranch.trim()) {
        errors.push(
          "Preferred branch is required.",
        );
      }

      if (
        requirement.requestedServices.length === 0
      ) {
        errors.push(
          "Select at least one banking service.",
        );
      }
    }
  }

  if (
    application.type ===
    "CONNECT_EXISTING_ACCOUNT"
  ) {
    const requirement =
      application.existingAccountRequirement;

    if (!requirement) {
      errors.push(
        "Existing-account details are missing.",
      );
    } else {
      if (
        !/^\d{6,18}$/.test(
          requirement.accountNumber
            .trim()
            .replaceAll(" ", ""),
        )
      ) {
        errors.push(
          "Enter a valid existing account number.",
        );
      }

      if (!requirement.corporateId.trim()) {
        errors.push("Corporate ID is required.");
      }

      if (!requirement.accountName.trim()) {
        errors.push(
          "Existing account name is required.",
        );
      }

      if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
          requirement.ifscCode
            .trim()
            .toUpperCase(),
        )
      ) {
        errors.push("Enter a valid IFSC code.");
      }

      if (
        requirement.requestedServices.length === 0
      ) {
        errors.push(
          "Select at least one banking service.",
        );
      }
    }
  }

  if (
    application.authorisedSignatories.length === 0
  ) {
    errors.push(
      "Add at least one authorised signatory.",
    );
  }

  application.authorisedSignatories.forEach(
    (signatory, index) => {
      const signatoryNumber = index + 1;

      if (!signatory.fullName.trim()) {
        errors.push(
          `Authorised signatory ${signatoryNumber} name is required.`,
        );
      }

      if (
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
          signatory.pan.trim().toUpperCase(),
        )
      ) {
        errors.push(
          `Authorised signatory ${signatoryNumber} PAN is invalid.`,
        );
      }
    },
  );

  const makerCount =
    application.proposedNeoBankUsers.filter(
      (proposedUser) =>
        proposedUser.role === "MAKER",
    ).length;

  const checkerCount =
    application.proposedNeoBankUsers.filter(
      (proposedUser) =>
        proposedUser.role === "CHECKER",
    ).length;

  if (makerCount === 0) {
    errors.push(
      "Add at least one proposed Maker user.",
    );
  }

  if (checkerCount === 0) {
    errors.push(
      "Add at least one proposed Checker user.",
    );
  }

  if (application.proposedMopRules.length === 0) {
    errors.push(
      "Configure at least one proposed MOP rule.",
    );
  }

  application.proposedMopRules.forEach(
    (rule) => {
      if (rule.stages.length === 0) {
        errors.push(
          `${rule.operationType.replaceAll(
            "_",
            " ",
          )} must contain at least one approval stage.`,
        );

        return;
      }

      rule.stages.forEach((stage) => {
        if (stage.requiredApprovals < 1) {
          errors.push(
            `${stage.stageName} must require at least one approval.`,
          );
        }

        if (
          stage.eligibleNeoBankUserIds.length <
          stage.requiredApprovals
        ) {
          errors.push(
            `${stage.stageName} does not have enough eligible Checker users.`,
          );
        }
      });
    },
  );

  const requiredDocumentTypes = [
    "PAN",
    "GST_CERTIFICATE",
    "INCORPORATION_DOCUMENT",
    "BOARD_RESOLUTION",
    "AUTHORISED_SIGNATORY_DOCUMENT",
  ];

  requiredDocumentTypes.forEach(
    (requiredDocumentType) => {
      const documentExists =
        application.documents.some(
          (document) =>
            document.documentType ===
              requiredDocumentType &&
            document.status !== "NOT_ADDED",
        );

      if (!documentExists) {
        errors.push(
          `${requiredDocumentType.replaceAll(
            "_",
            " ",
          )} is required.`,
        );
      }
    },
  );

  if (!application.declarationAccepted) {
    errors.push(
      "Accept the declaration before submitting the application.",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function submitOnboardingApplication(
  applicationId: string,
): Promise<SubmitOnboardingResult> {
  await delay();

  const database = getMockDatabase();

  const application =
    database.accountOpeningApplications.find(
      (item) => item.id === applicationId,
    );

  if (!application) {
    throw new Error(
      "The account-opening application could not be found.",
    );
  }

  const validationResult =
    validateOnboardingApplication(application);

  if (!validationResult.isValid) {
    throw new Error(
      validationResult.errors.join(" "),
    );
  }

  const submittedAt = new Date().toISOString();

  let submittedApplication:
    | AccountOpeningApplication
    | undefined;

  updateMockDatabase((updatedDatabase) => {
    const storedApplication =
      updatedDatabase.accountOpeningApplications.find(
        (item) => item.id === applicationId,
      );

    if (!storedApplication) {
      throw new Error(
        "The account-opening application could not be found.",
      );
    }

    storedApplication.status = "SUBMITTED";

    storedApplication.submittedAt =
      submittedAt;

    storedApplication.submittedByUserId =
      storedApplication.applicant.workEmail;

    storedApplication.submittedByName =
      storedApplication.applicant.fullName;

    storedApplication.updatedAt =
      submittedAt;

    storedApplication.neoBankReview = {
      status: "NOT_STARTED",
    };

    submittedApplication =
      structuredClone(storedApplication);
  });

  if (!submittedApplication) {
    throw new Error(
      "The submitted application result could not be determined.",
    );
  }

  return {
    application: submittedApplication,
    message:
      "Account-opening application submitted for review.",
  };
}

export async function getNeoBankOnboardingQueue(): Promise<
  AccountOpeningApplication[]
> {
  await delay();

  const database = getMockDatabase();

  return database.accountOpeningApplications
    .filter(
      (application) =>
        application.status !== "DRAFT",
    )
    .sort(
      (first, second) =>
        new Date(
          second.submittedAt ??
            second.updatedAt,
        ).getTime() -
        new Date(
          first.submittedAt ??
            first.updatedAt,
        ).getTime(),
    )
    .map((application) =>
      structuredClone(application),
    );
}

export type CompleteMerchantOnboardingInput = {
  applicationId: string;
  completedByUserId: string;
  completedByName: string;
};

export type GeneratedMerchantCredential = {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  username: string;
  initialPassword: string;
  bankCredentials?: {
    corporateId: string;
    bankUserId: string;
    password: string;
  };
};

export type CompleteMerchantOnboardingResult = {
  application: AccountOpeningApplication;
  credentials: GeneratedMerchantCredential[];
  message: string;
};

function generateOpenedAccountNumber(): string {
  return String(
    Math.floor(
      100000000000 + Math.random() * 900000000000,
    ),
  );
}

function generateCorporateId(): string {
  const randomPart = Math.floor(
    100000 + Math.random() * 900000,
  );

  return `CORP${randomPart}`;
}

function maskOpenedAccountNumber(
  accountNumber: string,
): string {
  const visibleDigits = accountNumber.slice(-4);

  const hiddenLength = Math.max(
    accountNumber.length - visibleDigits.length,
    4,
  );

  return `${"X".repeat(hiddenLength)}${visibleDigits}`;
}

function mapOnboardingRoleToUserRole(
  role:
    AccountOpeningApplication["proposedNeoBankUsers"][number]["role"],
): UserRole {
  if (role === "CORPORATE_ADMIN") {
    return "CORPORATE_ADMIN";
  }

  if (role === "MAKER") {
    return "MAKER";
  }

  if (role === "CHECKER") {
    return "CHECKER";
  }

  return "VIEW_ONLY";
}

function getInitialPassword(
  role: UserRole,
): string {
  if (role === "CORPORATE_ADMIN") {
    return "Corporate@123";
  }

  if (role === "MAKER") {
    return "Maker@123";
  }

  if (
    role === "CHECKER" ||
    role === "CHECKER_LEVEL_1" ||
    role === "CHECKER_LEVEL_2"
  ) {
    return "Checker@123";
  }

  return "Viewer@123";
}

function createUsernameBase(
  email: string,
  fullName: string,
): string {
  const emailPrefix = email
    .trim()
    .toLowerCase()
    .split("@")[0]
    .replace(/[^a-z0-9]/g, "");

  if (emailPrefix) {
    return emailPrefix;
  }

  const namePrefix = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return namePrefix || "merchantuser";
}

function generateUniqueUsername(
  preferredUsername: string,
  users: MockUser[],
): string {
  const normalizedUsername =
    preferredUsername.trim().toLowerCase();

  const usernameExists = users.some(
    (user) =>
      user.username.trim().toLowerCase() ===
      normalizedUsername,
  );

  if (!usernameExists) {
    return normalizedUsername;
  }

  let suffix = 2;
  let candidate =
    `${normalizedUsername}${suffix}`;

  while (
    users.some(
      (user) =>
        user.username.trim().toLowerCase() ===
        candidate,
    )
  ) {
    suffix += 1;
    candidate =
      `${normalizedUsername}${suffix}`;
  }

  return candidate;
}

export async function completeMerchantOnboarding(
  input: CompleteMerchantOnboardingInput,
): Promise<CompleteMerchantOnboardingResult> {
  await delay();

  const database = getMockDatabase();

  const application =
    database.accountOpeningApplications.find(
      (item) => item.id === input.applicationId,
    );

  if (!application) {
    throw new Error(
      "The merchant onboarding application could not be found.",
    );
  }

  if (application.status !== "DRAFT") {
    throw new Error(
      "Only a draft merchant onboarding application can be completed.",
    );
  }

  if (application.type !== "OPEN_NEW_ACCOUNT") {
    throw new Error(
      "Only new account opening is supported in the current NeoBank onboarding journey.",
    );
  }

  const validationResult =
    validateOnboardingApplication(application);

  if (!validationResult.isValid) {
    throw new Error(
      validationResult.errors.join(" "),
    );
  }

  if (!application.newAccountRequirement) {
    throw new Error(
      "The new account requirement is missing.",
    );
  }

  const accountNumber =
    generateOpenedAccountNumber();

  const maskedAccountNumber =
    maskOpenedAccountNumber(accountNumber);

  const corporateId = generateCorporateId();

  const completionTime =
    new Date().toISOString();

  const bankAccountId = crypto.randomUUID();
  const organisationId = crypto.randomUUID();

  const organisationReference =
    generateOrganisationReference();

  let completedApplication:
    | AccountOpeningApplication
    | undefined;

  const generatedCredentials:
  GeneratedMerchantCredential[] = [];

  updateMockDatabase((updatedDatabase) => {
    const storedApplication =
      updatedDatabase.accountOpeningApplications.find(
        (item) =>
          item.id === input.applicationId,
      );

    if (!storedApplication) {
      throw new Error(
        "The merchant onboarding application could not be found.",
      );
    }

    if (!storedApplication.newAccountRequirement) {
      throw new Error(
        "The new account requirement is missing.",
      );
    }

    const duplicateAccount =
      updatedDatabase.accounts.some(
        (account) =>
          account.accountNumber === accountNumber,
      );

    if (duplicateAccount) {
      throw new Error(
        "The generated account number already exists. Please retry onboarding.",
      );
    }

    const normalizedPan =
      storedApplication.organisation.pan
        .trim()
        .toUpperCase();

    const duplicateOrganisation =
      updatedDatabase.organisations.some(
        (organisation) =>
          organisation.onboardingApplicationId ===
            storedApplication.id ||
          organisation.pan
            .trim()
            .toUpperCase() === normalizedPan,
      );

    if (duplicateOrganisation) {
      throw new Error(
        "An active merchant organisation already exists for this onboarding application or PAN.",
      );
    }

    const merchantOrganisation: MerchantOrganisation = {
      id: organisationId,

      organisationReference,

      legalName:
        storedApplication.organisation.legalName,

      constitution:
        storedApplication.organisation.constitution,

      pan: normalizedPan,

      gstin:
        storedApplication.organisation.gstin
          .trim()
          .toUpperCase(),

      dateOfIncorporation:
        storedApplication.organisation
          .dateOfIncorporation,

      natureOfBusiness:
        storedApplication.organisation
          .natureOfBusiness,

      registeredAddress:
        storedApplication.organisation
          .registeredAddress,

      corporateId,

      primaryAccountId: bankAccountId,

      enabledServices: [
        ...storedApplication.newAccountRequirement
          .requestedServices,
      ],

      status: "ACTIVE",

      onboardingApplicationId:
        storedApplication.id,

      onboardingApplicationReference:
        storedApplication.applicationReference,

      createdAt: completionTime,
      activatedAt: completionTime,

      createdByUserId:
        input.completedByUserId,

      createdByName:
        input.completedByName,
    };

    updatedDatabase.organisations.push(
      merchantOrganisation,
    );

    const createdUsers: MockUser[] = [];

storedApplication.proposedNeoBankUsers.forEach(
  (proposedUser) => {
    const emailAlreadyRegistered =
      updatedDatabase.users.some(
        (existingUser) =>
          existingUser.email
            .trim()
            .toLowerCase() ===
            proposedUser.email
              .trim()
              .toLowerCase() &&
          existingUser.portal === "MERCHANT",
      );

    if (emailAlreadyRegistered) {
      throw new Error(
        `A Merchant user already exists with email ${proposedUser.email}.`,
      );
    }

    const operationalRole =
      mapOnboardingRoleToUserRole(
        proposedUser.role,
      );

    const username =
      generateUniqueUsername(
        createUsernameBase(
          proposedUser.email,
          proposedUser.fullName,
        ),
        [
          ...updatedDatabase.users,
          ...createdUsers,
        ],
      );



      const initialPassword =
  getInitialPassword(operationalRole);

    const operationalUser: MockUser = {
      /*
       * Preserve the proposed-user ID because the
       * proposed MOP stages already reference this ID.
       */
      id: proposedUser.id,

      username,
      password: initialPassword,

      fullName: proposedUser.fullName,
      email: proposedUser.email,

      portal: "MERCHANT",
      role: operationalRole,

      organisationId,
      organisationName:
        storedApplication.organisation.legalName,

      isActive: true,
    };

    createdUsers.push(operationalUser);

    generatedCredentials.push({
  userId: operationalUser.id,
  fullName: operationalUser.fullName,
  email: operationalUser.email,
  role: operationalUser.role,
  username: operationalUser.username,
  initialPassword,
});
  },
);

    updatedDatabase.users.push(...createdUsers);

    storedApplication.proposedMopRules.forEach(
      (rule, ruleIndex) => {
        updatedDatabase.modesOfOperation.push({
          id: crypto.randomUUID(),
          organisationId,
          mopReference: `MOP-${rule.operationType.replaceAll("_", "-")}-${ruleIndex + 1}`,
          version: 1,
          status: "ACTIVE",
          operationType: rule.operationType,
          stages: rule.stages.map((stage) => ({
            id: crypto.randomUUID(),
            sequence: stage.sequence,
            stageName: stage.stageName,
            requiredApprovals: stage.requiredApprovals,
            eligibleUserIds: [
              ...stage.eligibleNeoBankUserIds,
            ],
          })),
          effectiveFrom: completionTime.slice(0, 10),
        });
      },
    );

    // The bank holds its own copy of every checker's net banking identity.
    createdUsers
      .filter((user) => user.role === "CHECKER")
      .forEach((user) => {
        const bankCredentials = {
          corporateId,
          bankUserId: `bank${user.username}`,
          // shortcut: fixed initial bank password, replace with bank-issued credentials
          password: "BankChecker@123",
        };

        updatedDatabase.bankUsers.push({
          id: crypto.randomUUID(),
          ...bankCredentials,
          organisationId,
          platformUserId: user.id,
          fullName: user.fullName,
          isActive: true,
        });

        const credential = generatedCredentials.find(
          (item) => item.userId === user.id,
        );

        if (credential) {
          credential.bankCredentials = bankCredentials;
        }
      });


    storedApplication.status = "ACCOUNT_OPENED";
    storedApplication.updatedAt = completionTime;

    storedApplication.submittedAt ??= completionTime;

    storedApplication.submittedByUserId = input.completedByUserId;

    storedApplication.submittedByName = input.completedByName;

    storedApplication.neoBankReview = { status: "COMPLETED", 
      reviewedByUserId:input.completedByUserId,
      reviewedByName:input.completedByName,
      reviewStartedAt: completionTime,
      reviewCompletedAt: completionTime,
      remarks:
        "Merchant onboarding completed directly by NeoBank Platform Admin.",
    };

    storedApplication.bankReview = {
      status: "APPROVED",

      bankApplicationReference:
        `BANK-${storedApplication.applicationReference}`,

      reviewedByUserId:
        input.completedByUserId,

      reviewedByName:
        input.completedByName,

      reviewStartedAt: completionTime,
      reviewCompletedAt: completionTime,

      remarks:
        "Account details created through the mock onboarding workflow and made available to the Bank Admin portal.",
    };

    storedApplication.openedAccount = {
      bankAccountId,

      accountNumber,
      maskedAccountNumber,

      accountName:
        storedApplication.organisation.legalName,

      accountType:
        storedApplication.newAccountRequirement
          .accountType,

      corporateId,

      branchName:
        storedApplication.newAccountRequirement
          .preferredBranch ||
        "Mumbai Corporate Branch",

      ifscCode: "BANK0000123",

      enabledServices: [
        ...storedApplication.newAccountRequirement
          .requestedServices,
      ],

      openedOrLinkedByUserId:
        input.completedByUserId,

      openedOrLinkedByName:
        input.completedByName,

      openedOrLinkedAt: completionTime,
    };

    updatedDatabase.accounts.push({
      id: bankAccountId,

      organisationId,

      accountNumber,
      maskedAccountNumber,

      accountName:
        storedApplication.organisation.legalName,

      accountType: "CURRENT",
      currency: "INR",

      bankName: "Partner Bank",

      branchName:
        storedApplication.newAccountRequirement
          .preferredBranch ||
        "Mumbai Corporate Branch",

      ifscCode: "BANK0000123",

      availableBalance: 0,
      ledgerBalance: 0,

      status: "ACTIVE",
      isPrimary: true,
    });

    completedApplication =
      structuredClone(storedApplication);
  });

  if (!completedApplication) {
    throw new Error(
      "The completed onboarding result could not be determined.",
    );
  }

return {
  application: completedApplication,

  credentials:
    structuredClone(generatedCredentials),

  message:
    "Merchant onboarded successfully. The account, organisation and merchant users are now active.",
};
}

export async function getBankAdminOnboardingRecords(): Promise<
  AccountOpeningApplication[]
> {
  await delay();

  const database = getMockDatabase();

  const bankVisibleStatuses:
    AccountOpeningApplication["status"][] = [
      "APPROVED",
      "ACCOUNT_OPENING_IN_PROGRESS",
      "ACCOUNT_OPENED",
      "ACCOUNT_LINKED",
      "REJECTED",
    ];

  return database.accountOpeningApplications
    .filter((application) =>
      bankVisibleStatuses.includes(
        application.status,
      ),
    )
    .sort(
      (first, second) =>
        new Date(
          second.openedAccount
            ?.openedOrLinkedAt ??
            second.updatedAt,
        ).getTime() -
        new Date(
          first.openedAccount
            ?.openedOrLinkedAt ??
            first.updatedAt,
        ).getTime(),
    )
    .map((application) =>
      structuredClone(application),
    );
}

export async function getBankAdminOnboardingRecordById(
  applicationId: string,
): Promise<AccountOpeningApplication | undefined> {
  await delay();

  const database = getMockDatabase();

  const application =
    database.accountOpeningApplications.find(
      (item) =>
        item.id === applicationId &&
        (
          item.status === "APPROVED" ||
          item.status ===
            "ACCOUNT_OPENING_IN_PROGRESS" ||
          item.status === "ACCOUNT_OPENED" ||
          item.status === "ACCOUNT_LINKED" ||
          item.status === "REJECTED"
        ),
    );

  if (!application) {
    return undefined;
  }

  return structuredClone(application);
}
