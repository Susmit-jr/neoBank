export type PortalType =
  | "BANK_ADMIN"
  | "PLATFORM_ADMIN"
  | "MERCHANT";


export type UserRole =
  | "BANK_ADMIN"
  | "PLATFORM_ADMIN"
  | "CORPORATE_ADMIN"
  | "MAKER"
  | "CHECKER"
  | "CHECKER_LEVEL_1"
  | "CHECKER_LEVEL_2"
  | "VIEW_ONLY";

export type MockUser = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  portal: PortalType;
  role: UserRole;
  organisationId?: string;
  organisationName?: string;
  isActive: boolean;
};

export type AuthenticatedUser = Omit<MockUser, "password">;

export type LoginCredentials = {
  username: string;
  password: string;
  portal: PortalType;
};

export type LoginResult = {
  success: boolean;
  user?: AuthenticatedUser;
  message?: string;
};
