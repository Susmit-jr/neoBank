import { Outlet } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";

function BankAdminLayout() {
  return (
    <AppLayout
      portal="BANK_ADMIN"
      pageTitle="Bank Administration"
      pageDescription="Organisation, MOP, authorisation and processing oversight"
    >
      <Outlet />
    </AppLayout>
  );
}

export default BankAdminLayout;
