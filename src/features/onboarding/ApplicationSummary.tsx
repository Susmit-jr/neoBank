import type { ReactNode } from "react";
import type { AccountOpeningApplication } from "../../types/onboarding";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/dates";
import { documentOptions, humanise, serviceOptions } from "./labels";


function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
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
  );
}

function ApplicationSummary({
  application,
}: {
  application: AccountOpeningApplication;
}) {
  const requirement = application.newAccountRequirement;
  const userName = (id: string) =>
    application.proposedNeoBankUsers.find((user) => user.id === id)
      ?.fullName ?? "";

  const serviceLabel = (value: string) =>
    serviceOptions.find(([key]) => key === value)?.[1] ?? humanise(value);

  return (
    <div className="space-y-5">
      {application.openedAccount && (
        <Section title="Account opened">
          <Facts
            items={[
              ["CIF ID", application.openedAccount.cifId],
              ["Account number", application.openedAccount.accountNumber],
              ["Corporate ID", application.openedAccount.corporateId],
              ["IFSC", application.openedAccount.ifscCode],
              ["Branch", application.openedAccount.branchName],
              ["Account type", humanise(application.openedAccount.accountType)],
            ]}
          />
        </Section>
      )}

      <Section title="Applicant">
        <Facts
          items={[
            ["Name", application.applicant.fullName],
            ["Designation", application.applicant.designation],
            ["Work email", application.applicant.workEmail],
            ["Mobile", application.applicant.mobileNumber],
          ]}
        />
      </Section>

      <Section title="Company">
        <Facts
          items={[
            ["Legal name", application.organisation.legalName],
            ["Constitution", humanise(application.organisation.constitution)],
            ["PAN", application.organisation.pan],
            ["GSTIN", application.organisation.gstin],
            [
              "Date of incorporation",
              application.organisation.dateOfIncorporation
                ? formatDate(application.organisation.dateOfIncorporation)
                : "",
            ],
            ["Nature of business", application.organisation.natureOfBusiness],
            ["Registered address", application.organisation.registeredAddress],
          ]}
        />
      </Section>

      <Section title="Account and services">
        <Facts
          items={[
            [
              "Account type",
              requirement ? humanise(requirement.accountType) : "",
            ],
            ["Preferred branch", requirement?.preferredBranch ?? ""],
            [
              "Services",
              requirement?.requestedServices.map(serviceLabel).join(", ") ??
                "",
            ],
          ]}
        />
      </Section>

      <Section title="Authorised signatories">
        <ul className="divide-y divide-slate-100">
          {application.authorisedSignatories.map((signatory) => (
            <li
              key={signatory.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span>
                <span className="font-semibold text-slate-900">
                  {signatory.fullName}
                </span>
                <span className="ml-2 text-slate-500">
                  {signatory.designation}
                </span>
              </span>
              <span className="text-slate-500">
                {signatory.transactionLimit
                  ? `Limit ${formatCurrency(signatory.transactionLimit)}`
                  : humanise(signatory.authority)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Team and approvals">
        <ul className="divide-y divide-slate-100">
          {application.proposedNeoBankUsers.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span className="font-semibold text-slate-900">
                {user.fullName}
                <span className="ml-2 font-normal text-slate-500">
                  {user.email}
                </span>
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                {humanise(user.role)}
              </span>
            </li>
          ))}
        </ul>

        <ul className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          {application.proposedMopRules.map((rule) => (
            <li key={rule.id}>
              <span className="font-semibold">
                {rule.operationType === "PAYMENT"
                  ? "Payments"
                  : rule.operationType === "ADD_BALANCE"
                    ? "Adding balance"
                    : "Adding a beneficiary"}
                :
              </span>{" "}
              {rule.stages.map((stage) => (
                <span key={stage.id}>
                  {stage.requiredApprovals} of{" "}
                  {stage.eligibleNeoBankUserIds.length} checkers (
                  {stage.eligibleNeoBankUserIds.map(userName).join(", ")}) in
                  any order
                </span>
              ))}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Documents">
        <ul className="divide-y divide-slate-100 text-sm">
          {documentOptions.map(([type, label]) => {
            const document = application.documents.find(
              (item) => item.documentType === type,
            );

            return (
              <li
                key={type}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="font-medium text-slate-900">{label}</span>
                <span className="text-slate-500">
                  {document?.fileName ?? "Not provided"}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

export default ApplicationSummary;
