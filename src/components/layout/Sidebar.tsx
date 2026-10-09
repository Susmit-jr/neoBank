import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  ChevronLeft,
  CircleDollarSign,
  FileClock,
  Landmark,
  LayoutDashboard,
  Link2,
  ListChecks,
  ReceiptText,
  Settings,
  ShieldCheck,
  Store,
  Users,
  UserRoundCheck,
  WalletCards,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { portalThemes } from "../../design-system/portalTheme";
import type {
  AuthenticatedUser,
  PortalType,
} from "../../types/auth";

type NavigationItem = {
  label: string;
  path?: string;
  icon: LucideIcon;
  disabled?: boolean;
};

type SidebarProps = {
  portal: PortalType;
  user: AuthenticatedUser;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
};

const navigationByPortal: Record<
  PortalType,
  NavigationItem[]
> = {
  BANK_ADMIN: [
    {
      label: "Merchant Onboarding",
      path: "/bank-admin/onboarding",
      icon: Store,
    },

    {
      label: "Dashboard",
      path: "/bank-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Organisations",
      icon: Building2,
      disabled: true,
    },
    {
      label: "Account Mapping",
      icon: Link2,
      disabled: true,
    },
    {
      label: "MOP Management",
      icon: UserRoundCheck,
      disabled: true,
    },
    {
      label: "Authorisations",
      icon: ShieldCheck,
      disabled: true,
    },
    {
      label: "Payment Processing",
      icon: CircleDollarSign,
      disabled: true,
    },
    {
      label: "Exceptions",
      icon: FileClock,
      disabled: true,
    },
  ],

  PLATFORM_ADMIN: [
    {
      label: "Dashboard",
      path: "/platform-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Merchant Onboarding",
      path: "/platform-admin/onboarding",
      icon: Store,
    },
    {
      label: "Products",
      icon: WalletCards,
      disabled: true,
    },
    {
      label: "Platform Users",
      icon: Users,
      disabled: true,
    },
    {
      label: "Integrations",
      icon: Link2,
      disabled: true,
    },
    {
      label: "Notifications",
      icon: Bell,
      disabled: true,
    },
    {
      label: "Audit Events",
      icon: FileClock,
      disabled: true,
    },
    {
      label: "Settings",
      icon: Settings,
      disabled: true,
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
    },
    {
      label: "Reports",
      icon: ReceiptText,
      disabled: true,
    },
    {
      label: "Notifications",
      icon: Bell,
      disabled: true,
    },
    {
      label: "Administration",
      icon: Settings,
      disabled: true,
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
}: SidebarProps) {
  const navigationItems = navigationByPortal[portal].filter(
    (item) => !item.disabled && item.path,
  );
  const theme = portalThemes[portal];

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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-[var(--sidebar-surface)] text-white shadow-2xl shadow-slate-950/20 transition-[width,transform] duration-300 lg:translate-x-0 ${
          isCollapsed ? "w-72 lg:w-24" : "w-72"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`flex h-20 items-center border-b border-white/10 ${
            isCollapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sidebar-mark)] text-sm font-black tracking-[-0.04em] text-[var(--sidebar-mark-text)] shadow-lg">
              {theme.brandMark}
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-[0.06em] text-white">
                {theme.brand}
              </p>

              <p className="mt-1 truncate text-xs font-medium text-white/55">
                {theme.workspace}
              </p>
            </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white lg:hidden"
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
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
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
                        ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)] shadow-sm"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} />
                  {!isCollapsed && item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          {!isCollapsed && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName}
            </p>

            <p className="mt-1 truncate text-xs text-white/45">
              {user.email}
            </p>

            <div className="mt-3 inline-flex rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/70">
              {user.role.replaceAll("_", " ")}
            </div>
          </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-white/45 transition hover:bg-white/10 hover:text-white lg:flex"
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
