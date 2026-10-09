import { Outlet } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";

function MerchantLayout() {
  return (
    <AppLayout
      portal="MERCHANT"
      pageTitle="Business Banking"
      pageDescription="Accounts, payments, approvals and cash-management services"
    >
      <Outlet />
    </AppLayout>
  );
}

export default MerchantLayout;
