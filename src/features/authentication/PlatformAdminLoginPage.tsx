import LoginPage from "./LoginPage";

function PlatformAdminLoginPage() {
  return (
    <LoginPage
      portal="PLATFORM_ADMIN"
      portalName="NeoBank Platform Admin"
      description="Access merchant onboarding, platform configuration, integration monitoring, notifications, audit and support functions."
      usernameLabel="Platform User ID"
      demoUsername="platformadmin"
      demoPassword="Platform@123"
    />
  );
}

export default PlatformAdminLoginPage;
