import { mockUsers } from "../mock-data/users";
import type {
  AuthenticatedUser,
  LoginCredentials,
  LoginResult,
  MockUser,
} from "../types/auth";
import { getMockDatabase } from "./mockDatabase";

const AUTH_STORAGE_KEY =
  "neobank_authenticated_user";

function removePassword(
  user: MockUser,
): AuthenticatedUser {
  const safeUser: Partial<MockUser> = { ...user };

  delete safeUser.password;

  return safeUser as AuthenticatedUser;
}

function getAvailableUsers(): MockUser[] {
  try {
    const database = getMockDatabase();

    if (
      Array.isArray(database.users) &&
      database.users.length > 0
    ) {
      return database.users;
    }
  } catch {
    // Fall back to the static mock users if the
    // mock database is not yet initialized.
  }

  return mockUsers;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 700);
  });

  const normalizedUsername =
    credentials.username.trim().toLowerCase();

  const availableUsers = getAvailableUsers();

  const user = availableUsers.find(
    (item) =>
      item.username.trim().toLowerCase() ===
        normalizedUsername &&
      item.portal === credentials.portal,
  );

  if (!user) {
    return {
      success: false,
      message:
        "The User ID is not registered for this portal.",
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      message:
        "This user account is inactive.",
    };
  }

  if (user.password !== credentials.password) {
    return {
      success: false,
      message:
        "The password entered is incorrect.",
    };
  }

  const authenticatedUser =
    removePassword(user);

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(authenticatedUser),
  );

  return {
    success: true,
    user: authenticatedUser,
  };
}

export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthenticatedUser():
  | AuthenticatedUser
  | null {
  const storedUser = localStorage.getItem(
    AUTH_STORAGE_KEY,
  );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser,
    ) as AuthenticatedUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}
