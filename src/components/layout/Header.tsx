import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { portalThemes } from "../../design-system/portalTheme";
import type {
  AuthenticatedUser,
  PortalType,
} from "../../types/auth";

type HeaderProps = {
  portal: PortalType;
  user: AuthenticatedUser;
  pageTitle: string;
  pageDescription: string;
  pageSection: string;
  onOpenSidebar: () => void;
  onLogout: () => void;
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");
}

function Header({
  portal,
  user,
  pageTitle,
  pageDescription,
  pageSection,
  onOpenSidebar,
  onLogout,
}: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const theme = portalThemes[portal];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[color:var(--header-surface)] backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-2.5 text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="mb-1 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] sm:flex">
              <span>{theme.shortWorkspace}</span>
              <span aria-hidden="true">/</span>
              <span className="text-[var(--brand-primary)]">{pageSection}</span>
            </div>

            <h1 className="truncate text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {pageTitle}
            </h1>

            <p className="mt-1 hidden truncate text-sm text-[var(--text-secondary)] md:block">
              {pageDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="mr-1 hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] xl:flex">
            <ShieldCheck size={14} className="text-[var(--brand-primary)]" />
            {theme.securityLabel}
          </div>

          <button
            type="button"
            className="hidden rounded-xl p-2.5 text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] sm:block"
            aria-label="Help and support"
          >
            <CircleHelp size={20} />
          </button>

          <button
            type="button"
            className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-2.5 text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            aria-label="Notifications"
          >
            <Bell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--brand-primary)] ring-2 ring-[var(--surface-raised)]" />
          </button>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() =>
                setIsProfileOpen((current) => !current)
              }
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-1.5 pr-2.5 transition hover:border-[var(--brand-primary)]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-xs font-bold text-white shadow-sm">
                {getInitials(user.fullName)}
              </div>

              <div className="hidden text-left md:block">
                <p className="max-w-44 truncate text-sm font-semibold text-[var(--text-primary)]">
                  {user.fullName}
                </p>

                <p className="max-w-44 truncate text-xs text-[var(--text-muted)]">
                  {user.role.replaceAll("_", " ")}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-[var(--text-muted)] transition md:block ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-2xl shadow-slate-950/10"
              >
                <div className="border-b border-[var(--border-subtle)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {user.fullName}
                  </p>

                  <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                    {user.email}
                  </p>

                  {user.organisationName && (
                    <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
                      {user.organisationName}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                >
                  <UserRound size={17} />
                  My profile
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  role="menuitem"
                  className="flex w-full items-center gap-3 border-t border-[var(--border-subtle)] px-4 py-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
