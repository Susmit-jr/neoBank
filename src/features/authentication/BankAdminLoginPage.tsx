import LoginPage from "./LoginPage";

function BankAdminLoginPage() {
  return (
    <LoginPage
      portal="BANK_ADMIN"
      portalName="Bank Admin"
      description="Access bank-side organisation setup, account mapping, MOP validation, authorisation controls and payment-processing functions."
      usernameLabel="Bank User ID"
      demoUsername="bankadmin"
      demoPassword="Bank@123"
    />
  );
}

export default BankAdminLoginPage;
