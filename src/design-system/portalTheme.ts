import type { PortalType } from "../types/auth";

type PortalTheme = {
  brand: string;
  brandMark: string;
  workspace: string;
  shortWorkspace: string;
  securityLabel: string;
};

export const portalThemes: Record<PortalType, PortalTheme> = {
  BANK_ADMIN: {
    brand: "IndusInd Bank",
    brandMark: "IB",
    workspace: "Bank Operations",
    shortWorkspace: "Bank Admin",
    securityLabel: "Bank-grade secure session",
  },
  PLATFORM_ADMIN: {
    brand: "X CORP",
    brandMark: "X",
    workspace: "NeoBank Control",
    shortWorkspace: "NeoBank Admin",
    securityLabel: "Platform secure session",
  },
  MERCHANT: {
    brand: "X CORP",
    brandMark: "X",
    workspace: "Business Banking",
    shortWorkspace: "Business Banking",
    securityLabel: "Protected business session",
  },
};

type PageMeta = {
  title: string;
  description: string;
  section: string;
};

const routeMetadata: Array<{
  matches: (portal: PortalType, pathname: string) => boolean;
  meta: PageMeta;
}> = [
  {
    matches: (portal, pathname) =>
      portal === "MERCHANT" && pathname.endsWith("/payments/new"),
    meta: {
      title: "Create payment",
      description: "Prepare and submit a new payment instruction",
      section: "Payments",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "MERCHANT" && pathname.endsWith("/beneficiaries/new"),
    meta: {
      title: "Add beneficiary",
      description: "Create a trusted recipient for future payments",
      section: "Beneficiaries",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "MERCHANT" && pathname.endsWith("/accounts"),
    meta: {
      title: "Accounts",
      description: "Balances, account details and transaction activity",
      section: "Workspace",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "MERCHANT" && pathname.endsWith("/beneficiaries"),
    meta: {
      title: "Beneficiaries",
      description: "Manage recipients and approval status",
      section: "Workspace",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "MERCHANT" && pathname.endsWith("/payments"),
    meta: {
      title: "Payments",
      description: "Track instructions from draft through settlement",
      section: "Workspace",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "MERCHANT" && pathname.endsWith("/approvals"),
    meta: {
      title: "Approvals",
      description: "Review and action requests assigned to you",
      section: "Workspace",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "BANK_ADMIN" && pathname.includes("/onboarding"),
    meta: {
      title: "Merchant onboarding",
      description: "Review organizations, controls and activation readiness",
      section: "Operations",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "PLATFORM_ADMIN" && pathname.includes("/onboarding/application/"),
    meta: {
      title: "Onboarding application",
      description: "Review application data, controls and provisioning",
      section: "Merchant onboarding",
    },
  },
  {
    matches: (portal, pathname) =>
      portal === "PLATFORM_ADMIN" && pathname.includes("/onboarding"),
    meta: {
      title: "Merchant onboarding",
      description: "Manage the application pipeline and provisioning status",
      section: "Operations",
    },
  },
  {
    matches: (_, pathname) => pathname.endsWith("/dashboard"),
    meta: {
      title: "Overview",
      description: "Your operational position and priority activity",
      section: "Workspace",
    },
  },
];

export function getPageMeta(
  portal: PortalType,
  pathname: string,
  fallback: Pick<PageMeta, "title" | "description">,
): PageMeta {
  return (
    routeMetadata.find((route) => route.matches(portal, pathname))?.meta ?? {
      ...fallback,
      section: "Workspace",
    }
  );
}
