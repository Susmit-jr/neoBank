import {
  Navigate,
  createBrowserRouter,
} from "react-router-dom";
import { ProtectedRoute } from "./routeGuards";

import PortalSelectionPage from "../features/authentication/PortalSelectionPage";
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

import ApplyPage from "../features/onboarding/ApplyPage";
import TrackPage from "../features/onboarding/TrackPage";
import ApplicationQueuePage from "../features/onboarding/ApplicationQueuePage";
import ApplicationReviewPage from "../features/onboarding/ApplicationReviewPage";
import OrganisationPage from "../features/organisation/OrganisationPage";
import AuditPage from "../features/audit/AuditPage";
import BankAuthorisationsPage from "../features/authorisations/BankAuthorisationsPage";
import PaymentsPage from "../features/payments/PaymentsPage";
import CreatePaymentPage from "../features/payments/CreatePaymentPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <PortalSelectionPage />,
  },

  {
    path: "/apply",
    element: <ApplyPage />,
  },
  {
    path: "/apply/:applicationId",
    element: <ApplyPage />,
  },
  {
    path: "/track",
    element: <TrackPage />,
  },

  {
    path: "/login/bank-admin",
    element: <PortalSelectionPage openPortal="BANK_ADMIN" />,
  },

  {
    path: "/login/platform-admin",
    element: <PortalSelectionPage openPortal="PLATFORM_ADMIN" />,
  },

  {
    path: "/login/merchant",
    element: <PortalSelectionPage openPortal="MERCHANT" />,
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
        element: (
          <ApplicationQueuePage
            reviewer="BANK"
            basePath="/bank-admin/onboarding"
          />
        ),
      },
      {
        path: "onboarding/application/:applicationId",
        element: (
          <ApplicationReviewPage
            reviewer="BANK"
            basePath="/bank-admin/onboarding"
          />
        ),
      },
      {
        path: "authorisations",
        element: <BankAuthorisationsPage />,
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
        element: (
          <ApplicationQueuePage
            reviewer="NEOBANK"
            basePath="/platform-admin/onboarding"
          />
        ),
      },
      {
        path: "onboarding/application/:applicationId",
        element: (
          <ApplicationReviewPage
            reviewer="NEOBANK"
            basePath="/platform-admin/onboarding"
          />
        ),
      },
      {
        path: "audit",
        element: <AuditPage />,
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
        path: "organisation",
        element: <OrganisationPage />,
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
