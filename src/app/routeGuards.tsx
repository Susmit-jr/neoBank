import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { SIGNED_OUT_KEY, useAuth } from "../store/AuthContext";
import type { PortalType, UserRole } from "../types/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedPortals?: PortalType[];
  allowedRoles?: UserRole[];
};

function getLoginRoute(portal?: PortalType) {
  if (portal === "BANK_ADMIN") {
    return "/login/bank-admin";
  }

  if (portal === "PLATFORM_ADMIN") {
    return "/login/platform-admin";
  }

  if (portal === "MERCHANT") {
    return "/login/merchant";
  }

  return "/";
}

export function ProtectedRoute({
  children,
  allowedPortals,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    if (sessionStorage.getItem(SIGNED_OUT_KEY)) {
      return <Navigate to="/" replace />;
    }

    const expectedPortal = allowedPortals?.[0];

    return (
      <Navigate
        to={getLoginRoute(expectedPortal)}
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const hasPortalAccess =
    !allowedPortals ||
    allowedPortals.includes(user.portal);

  const hasRoleAccess =
    !allowedRoles ||
    allowedRoles.includes(user.role);

  if (!hasPortalAccess || !hasRoleAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
