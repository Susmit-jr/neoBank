import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAuthenticatedUser,
  login as loginUser,
  logout as logoutUser,
} from "../services/authService";
import type {
  AuthenticatedUser,
  LoginCredentials,
  LoginResult,
} from "../types/auth";

type AuthContextValue = {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(() =>
    getAuthenticatedUser(),
  );

  async function login(
    credentials: LoginCredentials,
  ): Promise<LoginResult> {
    const result = await loginUser(credentials);

    if (result.success && result.user) {
      setUser(result.user);
    }

    return result;
  }

  function logout() {
    logoutUser();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
