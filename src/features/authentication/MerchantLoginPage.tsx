import LoginPage from "./LoginPage";

function MerchantLoginPage() {
  return (
    <LoginPage
      portal="MERCHANT"
      portalName="Merchant / Customer"
      description="Access corporate accounts, beneficiaries, payments, approvals, reports and user-administration capabilities."
      usernameLabel="Corporate User ID"
      demoUsername="maker"
      demoPassword="Maker@123"
    />
  );
}

export default MerchantLoginPage;
