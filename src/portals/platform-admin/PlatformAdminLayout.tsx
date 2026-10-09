import { Outlet } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";

function PlatformAdminLayout() {
  return (
    <AppLayout
      portal="PLATFORM_ADMIN"
      pageTitle="Platform Administration"
      pageDescription="Applications and platform activity"
    >
      <Outlet />
    </AppLayout>
  );
}

export default PlatformAdminLayout;
