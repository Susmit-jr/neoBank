import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChevronLeft,
  CircleDollarSign,
  FileClock,
  Landmark,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { getMockDatabase } from "../../services/mockDatabase";
import IndusIndLogo from "../branding/IndusIndLogo";
import { portalThemes } from "../../design-system/portalTheme";
import type {
  AuthenticatedUser,
  PortalType,
  UserRole,
} from "../../types/auth";

type NavigationItem = {
  label: string;
  path?: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

type SidebarProps = {
  portal: PortalType;
  user: AuthenticatedUser;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  approvalBadge: number;
};

const navigationByPortal: Record<
  PortalType,
  NavigationItem[]
> = {
  BANK_ADMIN: [
    {
      label: "Applications",
      path: "/bank-admin/onboarding",
      icon: Store,
    },

    {
      label: "Dashboard",
      path: "/bank-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Authorisations",
      path: "/bank-admin/authorisations",
      icon: ShieldCheck,
    },
  ],

  PLATFORM_ADMIN: [
    {
      label: "Dashboard",
      path: "/platform-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Applications",
      path: "/platform-admin/onboarding",
      icon: Store,
    },
    {
      label: "Audit Events",
      path: "/platform-admin/audit",
      icon: FileClock,
    },
  ],

  MERCHANT: [
    {
      label: "Dashboard",
      path: "/merchant/dashboard",
      icon: LayoutDashboard,
    },
    {
      
      label: "Accounts",
      path: "/merchant/accounts",
      icon: Landmark,
    },
    {
        label: "Beneficiaries",
        path: "/merchant/beneficiaries",
        icon: Users,
    },
    

    {
      label: "Payments",
      path: "/merchant/payments",
      icon: CircleDollarSign,
    },

    {
        label: "Approvals",
        path: "/merchant/approvals",
        icon: ListChecks,
        roles: [
          "CORPORATE_ADMIN",
          "CHECKER",
          "CHECKER_LEVEL_1",
          "CHECKER_LEVEL_2",
        ],
    },
    {
      label: "Add balance",
      path: "/merchant/add-balance",
      icon: WalletCards,
    },
    {
      label: "Organisation",
      path: "/merchant/organisation",
      icon: Building2,
    },
  ],
};

function Sidebar({
  portal,
  user,
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  approvalBadge,
}: SidebarProps) {
  const navigationItems = navigationByPortal[portal].filter(
    (item) =>
      item.path &&
      (!item.roles || item.roles.includes(user.role)),
  );
  const theme = portalThemes[portal];
  const cifId = getMockDatabase().organisations.find(
    (item) => item.id === user.organisationId,
  )?.cifId;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--sidebar-surface)] text-[var(--text-primary)] shadow-xl shadow-slate-950/5 transition-[width,transform] duration-300 lg:translate-x-0 ${
          isCollapsed ? "w-64 lg:w-24" : "w-64"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`flex h-20 items-center border-b border-[var(--border-subtle)] ${
            isCollapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          {portal === "BANK_ADMIN" ? (
            <div className="min-w-0">
              {isCollapsed ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sidebar-mark)] text-lg font-black text-[var(--sidebar-mark-text)]">
                  I
                </div>
              ) : (
                <>
                  <IndusIndLogo className="h-9" />
                  <p className="mt-1 truncate text-xs font-medium text-[var(--text-secondary)]">
                    {theme.workspace}
                  </p>
                </>
              )}
            </div>
          ) : (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sidebar-mark)] text-sm font-black tracking-[-0.04em] text-[var(--sidebar-mark-text)] shadow-sm">
              {theme.brandMark}
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-[0.06em] text-[var(--text-primary)]">
                {theme.brand}
              </p>

              <p className="mt-1 truncate text-xs font-medium text-[var(--text-secondary)]">
                {theme.workspace}
              </p>
            </div>
            )}
          </div>

          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav
          aria-label={`${theme.workspace} navigation`}
          className={`flex-1 overflow-y-auto py-6 ${
            isCollapsed ? "px-3" : "px-4"
          }`}
        >
          {!isCollapsed && (
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Workspace
            </p>
          )}

          <div className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.path!}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-xl py-3 text-sm font-semibold transition ${
                      isCollapsed
                        ? "justify-center px-2"
                        : "gap-3 px-3"
                    } ${
                      isActive
                        ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    }`
                  }
                >
                  <Icon size={19} />
                  {!isCollapsed && item.label}

                  {item.path === "/merchant/approvals" &&
                    approvalBadge > 0 && (
                      <span
                        aria-label={`${approvalBadge} pending approvals`}
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white ${
                          isCollapsed
                            ? "absolute right-1 top-1"
                            : "ml-auto"
                        }`}
                      >
                        {approvalBadge > 9 ? "9+" : approvalBadge}
                      </span>
                    )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-[var(--border-subtle)] p-4">
          {!isCollapsed && (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {user.fullName}
            </p>

            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
              {user.email}
            </p>

            {cifId && (
              <p className="mt-2 text-[11px] font-semibold text-[var(--text-secondary)]">
                CIF ID {cifId}
              </p>
            )}

            <div className="mt-3 inline-flex rounded-md bg-[var(--brand-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-primary)]">
              {user.role.replaceAll("_", " ")}
            </div>
          </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] lg:flex"
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <ChevronLeft
              size={16}
              className={`transition ${isCollapsed ? "rotate-180" : ""}`}
            />
            {!isCollapsed && "Collapse navigation"}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
