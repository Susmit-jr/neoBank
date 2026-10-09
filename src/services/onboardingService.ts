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

const sampleCompanies = [
  { name: "Zenith Retail Ventures Private Limited", business: "Retail and consumer goods", address: "Plot 14, Sector 18, Gurugram, Haryana 122015", branch: "Delhi Connaught Place", year: "2019-08-21" },
  { name: "Bluepeak Logistics Private Limited", business: "Freight and warehousing", address: "Unit 7, Bhosari MIDC, Pune, Maharashtra 411026", branch: "Mumbai Corporate Branch", year: "2017-02-09" },
  { name: "Northwind Foods Private Limited", business: "Packaged food manufacturing", address: "12, Industrial Area Phase 2, Chandigarh 160002", branch: "Delhi Connaught Place", year: "2020-11-03" },
  { name: "Vertex Software Labs Private Limited", business: "Software development services", address: "4th Floor, Embassy Tech Square, Bengaluru, Karnataka 560103", branch: "Bengaluru MG Road", year: "2018-06-27" },
  { name: "Silverline Textiles Private Limited", business: "Textile manufacturing and export", address: "88, Tirupur Road, Coimbatore, Tamil Nadu 641604", branch: "Chennai Anna Salai", year: "2016-09-14" },
  { name: "Orchid Healthcare Solutions Private Limited", business: "Medical devices distribution", address: "5, Salt Lake Sector V, Kolkata, West Bengal 700091", branch: "Mumbai Corporate Branch", year: "2022-01-18" },
];

const samplePeople = [
  "Aditya Rao", "Meera Iyer", "Vikram Singh", "Ananya Gupta", "Rahul Desai",
  "Sneha Kulkarni", "Imran Qureshi", "Kavita Menon", "Sanjay Patil", "Pooja Bhatia",
  "Nikhil Joshi", "Divya Reddy", "Harsh Vora", "Tara Banerjee", "Manish Agarwal",
  "Ritu Chawla", "Farhan Ali", "Lakshmi Nair", "Gaurav Saxena", "Isha Kapoor",
];

const pickOne = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

function pickPeople(count: number): string[] {
  return [...samplePeople].sort(() => Math.random() - 0.5).slice(0, count);
}

const randomPersonalPan = () => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = () => letters[Math.floor(Math.random() * letters.length)];
  return `${letter()}${letter()}${letter()}P${letter()}${Math.floor(1000 + Math.random() * 9000)}${letter()}`;
};

const randomMobile = () => `9${Math.floor(100000000 + Math.random() * 899999999)}`;

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

  const adminMobile = randomMobile();
  const checkerTwoMobile = randomMobile();
  const company = pickOne(sampleCompanies);
  const [applicantName, adminName, makerName, checkerOneName, checkerTwoName] =
    pickPeople(5);
  const domain = `${company.name.split(" ")[0].toLowerCase()}.in`;

  const mockEmail = (
    name: string,
  ): string => {
    return `${name.toLowerCase().replace(/\s+/g, ".")}.${applicationSuffix}@${domain}`;
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

      fullName: adminName,
      designation: "Chief Financial Officer",

      email: mockEmail(adminName),
      mobileNumber: adminMobile,
      pan: randomPersonalPan(),

      authority: "BOTH",

      transactionLimit: 10000000,
    },
    {
      id: signatoryTwoId,

      fullName: checkerTwoName,
      designation: "Finance Director",

      email: mockEmail(checkerTwoName),
      mobileNumber: checkerTwoMobile,
      pan: randomPersonalPan(),

      authority: "BANKING_TRANSACTIONS",

      transactionLimit: 5000000,
    },
  ];

  const proposedNeoBankUsers: ProposedNeoBankUser[] = [
    {
      id: corporateAdminId,

      fullName: adminName,
      email: mockEmail(adminName),
      mobileNumber: adminMobile,

      role: "CORPORATE_ADMIN",

      linkedSignatoryId: signatoryOneId,
    },
    {
      id: makerId,

      fullName: makerName,
      email: mockEmail(makerName),
      mobileNumber: randomMobile(),

      role: "MAKER",
    },
    {
      id: checkerOneId,

      fullName: checkerOneName,
      email: mockEmail(checkerOneName),
      mobileNumber: randomMobile(),

      role: "CHECKER",

      linkedSignatoryId: signatoryOneId,
    },
    {
      id: checkerTwoId,

      fullName: checkerTwoName,
      email: mockEmail(checkerTwoName),
      mobileNumber: checkerTwoMobile,

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

          requiredApprovals: 2,

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
      fileName: "company_pan.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType: "GST_CERTIFICATE",
      fileName: "gst_certificate.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType: "INCORPORATION_DOCUMENT",
      fileName:
        "certificate_of_incorporation.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType: "BOARD_RESOLUTION",
      fileName: "board_resolution.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
    {
      id: crypto.randomUUID(),

      documentType:
        "AUTHORISED_SIGNATORY_DOCUMENT",

      fileName:
        "authorised_signatory.pdf",

      status: "ADDED",
      uploadedAt: new Date().toISOString(),

      isMockDocument: true,
    },
  ];

  const mockApplication: AccountOpeningApplication = {
    ...structuredClone(application),

    applicant: {
      fullName: applicantName,

      workEmail: mockEmail(applicantName),

      mobileNumber: randomMobile(),

      designation: "Finance Manager",
    },

    organisation: {
      legalName:
        company.name,

      constitution:
        "PRIVATE_LIMITED_COMPANY",

      pan: generateMockPan(),
      gstin: generateMockGstin(),

      dateOfIncorporation: company.year,

      natureOfBusiness:
        company.business,

      registeredAddress:
        company.address,
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
        company.branch,

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

// A unique 10-digit customer identification number for the company.
function generateCifId(): string {
  const taken = new Set(
    getMockDatabase().organisations.map((organisation) => organisation.cifId),
  );

  const next = (): string => String(Math.floor(1e9 + Math.random() * 9e9));
  let cifId = next();

  while (taken.has(cifId)) {
    cifId = next();
  }

  return cifId;
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

  if (application.status !== "SUBMITTED_TO_BANK") {
    throw new Error(
      "Only an application approved by NeoBank and sent to the bank can be opened.",
    );
  }

  if (application.type !== "OPEN_NEW_ACCOUNT") {
    throw new Error(
      "Only new account opening is supported in the current NeoBank onboarding journey.",
    );
  }

  const validationResult =
    validateOnboardingApplication({
      ...application,
      status: "DRAFT",
    });

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
  const cifId = generateCifId();

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
      cifId,

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
        "Application approved and account opened by the bank.",
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
      cifId,

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

    storedApplication.issuedCredentials =
      structuredClone(generatedCredentials);

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
    "Application approved. The account has been opened and the business users are now active.",
};
}

export async function getBankAdminOnboardingRecords(): Promise<
  AccountOpeningApplication[]
> {
  await delay();

  const database = getMockDatabase();

  const bankVisibleStatuses:
    AccountOpeningApplication["status"][] = [
      "SUBMITTED_TO_BANK",
      "UNDER_BANK_REVIEW",
      "ACCOUNT_OPENED",
      "ACCOUNT_LINKED",
    ];

  return database.accountOpeningApplications
    .filter(
      (application) =>
        bankVisibleStatuses.includes(
          application.status,
        ) ||
        (application.status === "REJECTED" &&
          application.bankReview.status === "REJECTED"),
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

type ReviewActor = { userId: string; name: string };

// NeoBank reviews the application first and either sends it to the bank or rejects it.
export async function neoBankDecision(
  applicationId: string,
  decision: "APPROVE" | "REJECT",
  actor: ReviewActor,
  reason?: string,
): Promise<AccountOpeningApplication> {
  await delay();

  if (decision === "REJECT" && !reason?.trim()) {
    throw new Error("A reason is required to reject an application.");
  }

  let updated: AccountOpeningApplication | undefined;
  const now = new Date().toISOString();

  updateMockDatabase((database) => {
    const application = database.accountOpeningApplications.find(
      (item) => item.id === applicationId,
    );

    if (
      !application ||
      (application.status !== "SUBMITTED" &&
        application.status !== "UNDER_NEOBANK_REVIEW")
    ) {
      throw new Error(
        "This application is not awaiting NeoBank review.",
      );
    }

    application.neoBankReview = {
      status: "COMPLETED",
      reviewedByUserId: actor.userId,
      reviewedByName: actor.name,
      reviewStartedAt: now,
      reviewCompletedAt: now,
      remarks:
        decision === "APPROVE"
          ? "Application verified and sent to the bank."
          : reason?.trim(),
    };

    application.status =
      decision === "APPROVE" ? "SUBMITTED_TO_BANK" : "REJECTED";
    application.updatedAt = now;

    updated = structuredClone(application);
  });

  return updated!;
}

// The bank approves (which opens the account and activates the users) or rejects.
export async function bankDecision(
  applicationId: string,
  decision: "APPROVE" | "REJECT",
  actor: ReviewActor,
  reason?: string,
): Promise<AccountOpeningApplication> {
  if (decision === "APPROVE") {
    const result = await completeMerchantOnboarding({
      applicationId,
      completedByUserId: actor.userId,
      completedByName: actor.name,
    });

    return result.application;
  }

  await delay();

  if (!reason?.trim()) {
    throw new Error("A reason is required to reject an application.");
  }

  let updated: AccountOpeningApplication | undefined;
  const now = new Date().toISOString();

  updateMockDatabase((database) => {
    const application = database.accountOpeningApplications.find(
      (item) => item.id === applicationId,
    );

    if (
      !application ||
      (application.status !== "SUBMITTED_TO_BANK" &&
        application.status !== "UNDER_BANK_REVIEW")
    ) {
      throw new Error("This application is not awaiting bank review.");
    }

    application.bankReview = {
      status: "REJECTED",
      reviewedByUserId: actor.userId,
      reviewedByName: actor.name,
      reviewStartedAt: now,
      reviewCompletedAt: now,
      rejectionReason: reason.trim(),
    };

    application.status = "REJECTED";
    application.updatedAt = now;

    updated = structuredClone(application);
  });

  return updated!;
}

// Public status lookup for the applicant: both the reference and the email must match.
export async function trackApplication(
  reference: string,
  email: string,
): Promise<AccountOpeningApplication | undefined> {
  await delay();

  const application = getMockDatabase().accountOpeningApplications.find(
    (item) =>
      item.status !== "DRAFT" &&
      item.applicationReference.toLowerCase() ===
        reference.trim().toLowerCase() &&
      item.applicant.workEmail.toLowerCase() ===
        email.trim().toLowerCase(),
  );

  return application ? structuredClone(application) : undefined;
}
