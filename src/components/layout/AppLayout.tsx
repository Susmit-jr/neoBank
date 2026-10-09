import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPageMeta } from "../../design-system/portalTheme";
import { processAllAuthorisedPayments } from "../../services/paymentProcessingService";
import { useAuth } from "../../store/AuthContext";
import type { PortalType } from "../../types/auth";
import Header from "./Header";
import Sidebar from "./Sidebar";

type AppLayoutProps = {
  portal: PortalType;
  pageTitle: string;
  pageDescription: string;
  children: ReactNode;
};

function AppLayout({
  portal,
  pageTitle,
  pageDescription,
  children,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Authorised payments are sent to the bank wherever the user is in the portal.
  useEffect(() => {
    if (portal !== "MERCHANT") {
      return;
    }

    const timer = window.setInterval(
      () => void processAllAuthorisedPayments(),
      2000,
    );

    return () => window.clearInterval(timer);
  }, [portal]);

  if (!user) {
    return null;
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const pageMeta = getPageMeta(portal, location.pathname, {
    title: pageTitle,
    description: pageDescription,
  });

  return (
    <div
      data-portal={portal}
      className="portal-shell min-h-screen bg-[var(--app-canvas)] text-[var(--text-primary)]"
    >
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition focus:translate-y-0"
      >
        Skip to content
      </a>

      <Sidebar
        portal={portal}
        user={user}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() =>
          setIsSidebarCollapsed((current) => !current)
        }
      />

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64"
        }`}
      >
        <Header
          portal={portal}
          user={user}
          pageTitle={pageMeta.title}
          pageDescription={pageMeta.description}
          pageSection={pageMeta.section}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main id="main-content" className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
