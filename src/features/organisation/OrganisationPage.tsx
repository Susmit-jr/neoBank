import { useAuth } from "../../store/AuthContext";
import { getMockDatabase } from "../../services/mockDatabase";
import { humanise } from "../onboarding/labels";
import { EmptyRow, Panel } from "../dashboard/DashboardParts";
import { formatDate } from "../../utils/dates";

const operationLabels: Record<string, string> = {
  BENEFICIARY_CREATION: "Adding a beneficiary",
  BENEFICIARY_MODIFICATION: "Changing a beneficiary",
  BENEFICIARY_DEACTIVATION: "Removing a beneficiary",
  PAYMENT: "Making a payment",
  ADD_BALANCE: "Adding balance",
};

const roleGroups = [
  ["CORPORATE_ADMIN", "Corporate admins"],
  ["MAKER", "Makers"],
  ["CHECKER", "Checkers"],
  ["VIEW_ONLY", "View only"],
] as const;

function OrganisationPage() {
  const { user } = useAuth();
  const database = getMockDatabase();
  const organisationId = user?.organisationId;

  const organisation = database.organisations.find(
    (item) => item.id === organisationId,
  );

  const team = database.users.filter(
    (member) =>
      member.organisationId === organisationId && member.isActive,
  );

  // Seeded checkers use level roles; show them together as checkers.
  const groupOf = (role: string) =>
    role.startsWith("CHECKER") ? "CHECKER" : role;

  const rules = database.modesOfOperation.filter(
    (mop) => mop.organisationId === organisationId && mop.status === "ACTIVE",
  );

  const nameOf = (userId: string) =>
    database.users.find((item) => item.id === userId)?.fullName ??
    "Unknown user";

  const accounts = database.accounts.filter(
    (account) => account.organisationId === organisationId,
  );

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-medium text-slate-500">Your company</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-950">
        {organisation?.legalName ?? user?.organisationName ?? "Organisation"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Who works on your account and who approves what. To change the team or
        the approval rules, contact your relationship manager.
      </p>

      <div className="mt-8 space-y-6">
        <Panel
          title="Company details"
          description="As registered with us"
        >
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Corporate ID", organisation?.corporateId],
                [
                  "Type of company",
                  organisation ? humanise(organisation.constitution) : "",
                ],
                ["PAN", organisation?.pan],
                ["GSTIN", organisation?.gstin],
                [
                  "Date of incorporation",
                  organisation?.dateOfIncorporation
                    ? formatDate(organisation.dateOfIncorporation)
                    : "",
                ],
                ["Accounts", `${accounts.length} active`],
                ["Registered address", organisation?.registeredAddress],
              ] as [string, string | undefined][]
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                  {value || "-"}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel
          title="Your team"
          description="Makers prepare payments and beneficiaries. Checkers authorise them."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {roleGroups.map(([role, label]) => {
              const members = team.filter(
                (member) => groupOf(member.role) === role,
              );

              return (
                <div key={role}>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {label}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {members.length}
                    </span>
                  </h4>

                  {members.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">None</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-slate-100">
                      {members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {member.fullName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>

                          {member.id === user?.id && (
                            <span className="rounded-md bg-[var(--brand-soft)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                              You
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Who approves what"
          description="Any of the listed checkers can approve, in any order."
        >
          {rules.length === 0 ? (
            <EmptyRow message="No approval rules are set up yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {rules.map((rule) =>
                rule.stages.map((stage) => (
                  <li
                    key={stage.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {operationLabels[rule.operationType] ??
                          rule.operationType}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {stage.eligibleUserIds.map(nameOf).join(", ")}
                      </p>
                    </div>

                    <span className="rounded-md bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                      {stage.requiredApprovals} of{" "}
                      {stage.eligibleUserIds.length} checkers
                    </span>
                  </li>
                )),
              )}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}

export default OrganisationPage;
