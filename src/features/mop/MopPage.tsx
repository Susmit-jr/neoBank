import { useAuth } from "../../store/AuthContext";
import { getMockDatabase } from "../../services/mockDatabase";
import { formatDate } from "../../utils/dates";
import { EmptyRow, Panel } from "../dashboard/DashboardParts";

const operationLabels: Record<string, string> = {
  BENEFICIARY_CREATION: "Add beneficiary",
  BENEFICIARY_MODIFICATION: "Modify beneficiary",
  BENEFICIARY_DEACTIVATION: "Deactivate beneficiary",
  PAYMENT: "Payments",
};

function MopPage() {
  const { user } = useAuth();
  const database = getMockDatabase();

  const rules = database.modesOfOperation.filter(
    (mop) =>
      mop.organisationId === user?.organisationId &&
      mop.status === "ACTIVE",
  );

  const userName = (userId: string) =>
    database.users.find((item) => item.id === userId)
      ?.fullName ?? "Unknown user";

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-medium text-slate-500">
        Administration
      </p>
      <h2 className="mt-1 text-2xl font-bold text-slate-950">
        Approval rules
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        The checkers who must authorise each type of request for
        your company. Checkers can approve in any order. Changes
        are made through your banking relationship manager.
      </p>

      <div className="mt-8 space-y-6">
        {rules.length === 0 && (
          <EmptyRow message="No approval rules are configured." />
        )}

        {rules.map((rule) => (
          <Panel
            key={rule.id}
            title={operationLabels[rule.operationType] ?? rule.operationType}
            description={`${rule.mopReference} · Version ${rule.version} · Effective from ${formatDate(rule.effectiveFrom)}`}
          >
            <ul className="space-y-4">
              {rule.stages.map((stage) => (
                <li
                  key={stage.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {stage.stageName}
                    </p>
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {stage.requiredApprovals} of{" "}
                      {stage.eligibleUserIds.length} checkers
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {stage.eligibleUserIds
                      .map(userName)
                      .join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </section>
  );
}

export default MopPage;
