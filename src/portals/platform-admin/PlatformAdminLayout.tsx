import { Outlet } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";

function PlatformAdminLayout() {
  return (
    <AppLayout
      portal="PLATFORM_ADMIN"
      pageTitle="Platform Administration"
      pageDescription="Merchant onboarding, product and integration management"
    >
      <Outlet />
    </AppLayout>
  );
}

export default PlatformAdminLayout;
