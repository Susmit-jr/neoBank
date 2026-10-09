import {
  Navigate,
  createBrowserRouter,
} from "react-router-dom";
import { ProtectedRoute } from "./routeGuards";

import PortalSelectionPage from "../features/authentication/PortalSelectionPage";
import BankAdminLoginPage from "../features/authentication/BankAdminLoginPage";
import PlatformAdminLoginPage from "../features/authentication/PlatformAdminLoginPage";
import MerchantLoginPage from "../features/authentication/MerchantLoginPage";
import UnauthorizedPage from "../features/authentication/UnauthorizedPage";

import BankAdminDashboardPage from "../features/dashboard/BankAdminDashboardPage";
import PlatformAdminDashboardPage from "../features/dashboard/PlatformAdminDashboardPage";
import MerchantDashboardPage from "../features/dashboard/MerchantDashboardPage";

import BankAdminLayout from "../portals/bank-admin/BankAdminLayout";
import PlatformAdminLayout from "../portals/platform-admin/PlatformAdminLayout";
import MerchantLayout from "../portals/merchant/MerchantLayout";

import BankAuthorisationPage from "../portals/bank-authorisation/BankAuthorisationPage";

import AccountsPage from "../features/accounts/AccountsPage";

import BeneficiariesPage from "../features/beneficiaries/BeneficiariesPage";
import CreateBeneficiaryPage from "../features/beneficiaries/CreateBeneficiaryPage";

import ApprovalQueuePage from "../features/approvals/ApprovalQueuePage";

import PaymentsPage from "../features/payments/PaymentsPage";
import CreatePaymentPage from "../features/payments/CreatePaymentPage";

import AccountOpeningApplicationPage from "../features/onboarding/AccountOpeningApplicationPage";
import NeoBankOnboardingQueuePage from "../features/onboarding/NeoBankOnboardingQueuePage";
import BankAdminOnboardingPage from "../features/onboarding/BankAdminOnboardingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PortalSelectionPage />,
  },

  {
    path: "/login/bank-admin",
    element: <BankAdminLoginPage />,
  },

  {
    path: "/login/platform-admin",
    element: <PlatformAdminLoginPage />,
  },

  {
    path: "/login/merchant",
    element: <MerchantLoginPage />,
  },

  {
    path: "/bank-admin",
    element: (
      <ProtectedRoute
        allowedPortals={["BANK_ADMIN"]}
        allowedRoles={["BANK_ADMIN"]}
      >
        <BankAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to="dashboard"
            replace
          />
        ),
      },
      {
        path: "dashboard",
        element: <BankAdminDashboardPage />,
      },
      {
        path: "onboarding",
        element: <BankAdminOnboardingPage />,
      },
    ],
  },

  {
    path: "/platform-admin",
    element: (
      <ProtectedRoute
        allowedPortals={["PLATFORM_ADMIN"]}
        allowedRoles={["PLATFORM_ADMIN"]}
      >
        <PlatformAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to="dashboard"
            replace
          />
        ),
      },
      {
        path: "dashboard",
        element: <PlatformAdminDashboardPage />,
      },
      {
        path: "onboarding",
        element: <NeoBankOnboardingQueuePage />,
      },
      {
        path: "onboarding/application/:applicationId",
        element: (
          <AccountOpeningApplicationPage
            basePath="/platform-admin/onboarding"
          />
        ),
      },
    ],
  },

  {
    path: "/merchant",
    element: (
      <ProtectedRoute
        allowedPortals={["MERCHANT"]}
        allowedRoles={[
          "CORPORATE_ADMIN",
          "MAKER",
          "CHECKER",
          "CHECKER_LEVEL_1",
          "CHECKER_LEVEL_2",
          "VIEW_ONLY",
        ]}
      >
        <MerchantLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to="dashboard"
            replace
          />
        ),
      },
      {
        path: "dashboard",
        element: <MerchantDashboardPage />,
      },
      {
        path: "accounts",
        element: <AccountsPage />,
      },
      {
        path: "beneficiaries",
        element: <BeneficiariesPage />,
      },
      {
        path: "beneficiaries/new",
        element: (
          <ProtectedRoute
            allowedPortals={["MERCHANT"]}
            allowedRoles={[
              "MAKER",
              "CORPORATE_ADMIN",
            ]}
          >
            <CreateBeneficiaryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "payments",
        element: <PaymentsPage />,
      },
      {
        path: "payments/new",
        element: (
          <ProtectedRoute
            allowedPortals={["MERCHANT"]}
            allowedRoles={[
              "MAKER",
              "CORPORATE_ADMIN",
            ]}
          >
            <CreatePaymentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "approvals",
        element: (
          <ProtectedRoute
            allowedPortals={["MERCHANT"]}
            allowedRoles={[
              "CORPORATE_ADMIN",
              "CHECKER",
              "CHECKER_LEVEL_1",
              "CHECKER_LEVEL_2",
            ]}
          >
            <ApprovalQueuePage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  {
    path: "/bank-authorisation/:sessionId",
    element: <BankAuthorisationPage />,
  },

  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },

  {
    path: "*",
    element: <UnauthorizedPage />,
  },
]);
