import { useEffect, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createOnboardingDraft,
  generateMockOnboardingValues,
  getOnboardingApplicationById,
  saveOnboardingDraft,
  submitOnboardingApplication,
  validateOnboardingApplication,
} from "../../services/onboardingService";
import type {
  AccountOpeningApplication,
  AuthorisedSignatory,
  BankingService,
  NeoBankUserRole,
  OnboardingDocumentType,
  ProposedNeoBankUser,
} from "../../types/onboarding";
import ApplicationSummary from "./ApplicationSummary";
import {
  branches,
  documentOptions,
  humanise,
  serviceOptions,
} from "./labels";
import PublicShell from "./PublicShell";

const steps = [
  "Company",
  "Account",
  "Team and approvals",
  "Documents",
  "Review",
] as const;

const constitutions = [
  "PRIVATE_LIMITED_COMPANY",
  "PUBLIC_LIMITED_COMPANY",
  "LLP",
  "PARTNERSHIP",
  "SOLE_PROPRIETORSHIP",
  "TRUST",
  "SOCIETY",
  "ASSOCIATION",
] as const;

const roles: NeoBankUserRole[] = [
  "CORPORATE_ADMIN",
  "MAKER",
  "CHECKER",
  "VIEW_ONLY",
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function newId() {
  return crypto.randomUUID();
}

// Approval rules the applicant picks are stored as the application's MOP rules.
function buildRules(
  users: ProposedNeoBankUser[],
  beneficiaryApprovals: number,
  paymentApprovals: number,
): AccountOpeningApplicationRules {
  const checkerIds = users
    .filter((user) => user.role === "CHECKER")
    .map((user) => user.id);

  const rule = (
    operationType: "BENEFICIARY_CREATION" | "PAYMENT",
    stageName: string,
    approvals: number,
  ) => ({
    id: newId(),
    operationType,
    stages: [
      {
        id: newId(),
        sequence: 1,
        stageName,
        requiredApprovals: Math.min(
          Math.max(approvals, 1),
          Math.max(checkerIds.length, 1),
        ),
        eligibleNeoBankUserIds: checkerIds,
      },
    ],
  });

  return [
    rule(
      "BENEFICIARY_CREATION",
      "Beneficiary Authorisation",
      beneficiaryApprovals,
    ),
    rule("PAYMENT", "Payment Authorisation", paymentApprovals),
  ];
}

type AccountOpeningApplicationRules =
  AccountOpeningApplication["proposedMopRules"];

function approvalsFromRules(
  application: AccountOpeningApplication,
  operation: "BENEFICIARY_CREATION" | "PAYMENT",
) {
  return (
    application.proposedMopRules.find(
      (rule) => rule.operationType === operation,
    )?.stages[0]?.requiredApprovals ?? 1
  );
}

function stepErrors(
  step: number,
  application: AccountOpeningApplication,
): string[] {
  const errors: string[] = [];
  const { applicant, organisation } = application;

  if (step === 0) {
    if (!applicant.fullName.trim()) errors.push("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.workEmail))
      errors.push("Enter a valid work email.");
    if (!/^[6-9]\d{9}$/.test(applicant.mobileNumber.trim()))
      errors.push("Enter a valid 10-digit mobile number.");
    if (!applicant.designation.trim()) errors.push("Enter your designation.");
    if (!organisation.legalName.trim())
      errors.push("Enter the legal company name.");
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(organisation.pan.trim().toUpperCase()))
      errors.push("Enter a valid company PAN (for example AAACA1234F).");
    if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(
        organisation.gstin.trim().toUpperCase(),
      )
    )
      errors.push("Enter a valid GSTIN (for example 27AAACA1234F1Z5).");
    if (!organisation.dateOfIncorporation)
      errors.push("Enter the date of incorporation.");
    if (!organisation.natureOfBusiness.trim())
      errors.push("Describe the nature of your business.");
    if (!organisation.registeredAddress.trim())
      errors.push("Enter the registered address.");
  }

  if (step === 1) {
    const requirement = application.newAccountRequirement;
    if (!requirement?.preferredBranch) errors.push("Choose a branch.");
    if (!requirement?.requestedServices.length)
      errors.push("Select at least one service.");
  }

  if (step === 2) {
    const users = application.proposedNeoBankUsers;

    users.forEach((user, index) => {
      if (
        !user.fullName.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
      )
        errors.push(`Team member ${index + 1}: enter a name and valid email.`);
    });

    if (!users.some((user) => user.role === "MAKER"))
      errors.push("Add at least one Maker.");
    if (!users.some((user) => user.role === "CHECKER"))
      errors.push("Add at least one Checker.");
    if (!application.authorisedSignatories.length)
      errors.push("Add at least one authorised signatory.");

    application.authorisedSignatories.forEach((signatory, index) => {
      if (
        !signatory.fullName.trim() ||
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(signatory.pan.trim().toUpperCase())
      )
        errors.push(
          `Signatory ${index + 1}: enter a name and a valid PAN.`,
        );
    });
  }

  if (step === 3) {
    documentOptions.forEach(([type, label]) => {
      if (!application.documents.some((item) => item.documentType === type))
        errors.push(`Upload the ${label.toLowerCase()}.`);
    });
  }

  return errors;
}

function ApplyPage() {
  const navigate = useNavigate();
  const { applicationId } = useParams();

  const [application, setApplication] =
    useState<AccountOpeningApplication | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");
  const [beneficiaryApprovals, setBeneficiaryApprovals] = useState(1);
  const [paymentApprovals, setPaymentApprovals] = useState(1);

  useEffect(() => {
    async function load() {
      if (!applicationId) {
        const draft = await createOnboardingDraft({
          applicationType: "OPEN_NEW_ACCOUNT",
        });

        navigate(`/apply/${draft.id}`, { replace: true });
        return;
      }

      const existing = await getOnboardingApplicationById(applicationId);

      if (!existing || existing.status !== "DRAFT") {
        navigate("/track", { replace: true });
        return;
      }

      setApplication(existing);
      setBeneficiaryApprovals(
        approvalsFromRules(existing, "BENEFICIARY_CREATION"),
      );
      setPaymentApprovals(approvalsFromRules(existing, "PAYMENT"));
    }

    void load();
  }, [applicationId, navigate]);

  if (submittedReference && application) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={32} />
          </span>

          <h1 className="mt-6 text-2xl font-bold">Application submitted</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Thank you, {application.applicant.fullName}. X Corp will review
            your application and get your account ready. Keep your reference
            to check progress and collect your logins.
          </p>

          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-lg font-bold tracking-wide">
            {submittedReference}
          </p>

          <Link
            to={`/track?reference=${encodeURIComponent(submittedReference)}`}
            className="mt-6 inline-block rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Track your application
          </Link>
        </div>
      </PublicShell>
    );
  }

  if (!application) {
    return (
      <PublicShell>
        <div className="flex min-h-64 items-center justify-center text-slate-500">
          <LoaderCircle className="animate-spin" />
        </div>
      </PublicShell>
    );
  }

  const current = application;

  function update(next: Partial<AccountOpeningApplication>) {
    setApplication({ ...current, ...next });
    setErrors([]);
  }

  function withRules(
    next: AccountOpeningApplication,
    beneficiary = beneficiaryApprovals,
    payment = paymentApprovals,
  ) {
    return {
      ...next,
      proposedMopRules: buildRules(
        next.proposedNeoBankUsers,
        beneficiary,
        payment,
      ),
    };
  }

  async function persist(next: AccountOpeningApplication) {
    const saved = await saveOnboardingDraft(withRules(next));
    setApplication(saved);
    return saved;
  }

  async function handleContinue() {
    const found = stepErrors(step, current);

    if (found.length) {
      setErrors(found);
      return;
    }

    setIsBusy(true);

    try {
      await persist(current);
      setStep(step + 1);
      setErrors([]);
      window.scrollTo({ top: 0 });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmit() {
    if (!declared) {
      setErrors(["Confirm the declaration to submit your application."]);
      return;
    }

    setIsBusy(true);

    try {
      const saved = await persist({
        ...current,
        declarationAccepted: true,
        declarationAcceptedAt: new Date().toISOString(),
      });

      const validation = validateOnboardingApplication(saved);

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      const result = await submitOnboardingApplication(saved.id);
      setApplication(result.application);
      setSubmittedReference(result.application.applicationReference);
    } catch (submitError) {
      setErrors([
        submitError instanceof Error
          ? submitError.message
          : "The application could not be submitted.",
      ]);
    } finally {
      setIsBusy(false);
    }
  }

  function fillSample() {
    const filled = generateMockOnboardingValues(current);
    setApplication(filled);
    setBeneficiaryApprovals(approvalsFromRules(filled, "BENEFICIARY_CREATION"));
    setPaymentApprovals(approvalsFromRules(filled, "PAYMENT"));
    setErrors([]);
  }

  const checkerCount = current.proposedNeoBankUsers.filter(
    (user) => user.role === "CHECKER",
  ).length;
  const approvalChoices = Array.from(
    { length: Math.max(checkerCount, 1) },
    (_, index) => index + 1,
  );

  function setUser(index: number, patch: Partial<ProposedNeoBankUser>) {
    const users = current.proposedNeoBankUsers.map((user, position) =>
      position === index ? { ...user, ...patch } : user,
    );

    setApplication({ ...current, proposedNeoBankUsers: users });
    setErrors([]);
  }

  function setSignatory(index: number, patch: Partial<AuthorisedSignatory>) {
    update({
      authorisedSignatories: current.authorisedSignatories.map(
        (signatory, position) =>
          position === index ? { ...signatory, ...patch } : signatory,
      ),
    });
  }

  function toggleService(service: BankingService) {
    const requirement = current.newAccountRequirement;

    if (!requirement) return;

    const services = requirement.requestedServices.includes(service)
      ? requirement.requestedServices.filter((item) => item !== service)
      : [...requirement.requestedServices, service];

    update({
      newAccountRequirement: { ...requirement, requestedServices: services },
    });
  }

  function attachDocument(type: OnboardingDocumentType, fileName: string) {
    update({
      documents: [
        ...current.documents.filter((item) => item.documentType !== type),
        {
          id: newId(),
          documentType: type,
          fileName,
          status: "ADDED",
          uploadedAt: new Date().toISOString(),
          isMockDocument: false,
        },
      ],
    });
  }

  return (
    <PublicShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Open a business account
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em]">
            {steps[step]}
          </h1>
        </div>

        <button
          type="button"
          onClick={fillSample}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Sparkles size={16} />
          Fill sample data
        </button>
      </div>

      <ol className="mt-8 flex gap-2">
        {steps.map((label, index) => (
          <li key={label} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${
                index <= step ? "bg-blue-700" : "bg-slate-200"
              }`}
            />
            <p
              className={`mt-2 hidden text-xs font-semibold sm:block ${
                index === step ? "text-blue-700" : "text-slate-400"
              }`}
            >
              {index + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {errors.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your full name">
              <input
                className={inputClass}
                value={current.applicant.fullName}
                onChange={(event) =>
                  update({
                    applicant: {
                      ...current.applicant,
                      fullName: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Designation">
              <input
                className={inputClass}
                value={current.applicant.designation}
                onChange={(event) =>
                  update({
                    applicant: {
                      ...current.applicant,
                      designation: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Work email">
              <input
                type="email"
                className={inputClass}
                value={current.applicant.workEmail}
                onChange={(event) =>
                  update({
                    applicant: {
                      ...current.applicant,
                      workEmail: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Mobile number">
              <input
                className={inputClass}
                value={current.applicant.mobileNumber}
                onChange={(event) =>
                  update({
                    applicant: {
                      ...current.applicant,
                      mobileNumber: event.target.value,
                    },
                  })
                }
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Legal company name">
                <input
                  className={inputClass}
                  value={current.organisation.legalName}
                  onChange={(event) =>
                    update({
                      organisation: {
                        ...current.organisation,
                        legalName: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Type of company">
              <select
                className={inputClass}
                value={current.organisation.constitution}
                onChange={(event) =>
                  update({
                    organisation: {
                      ...current.organisation,
                      constitution: event.target
                        .value as AccountOpeningApplication["organisation"]["constitution"],
                    },
                  })
                }
              >
                {constitutions.map((item) => (
                  <option key={item} value={item}>
                    {humanise(item)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date of incorporation">
              <input
                type="date"
                className={inputClass}
                value={current.organisation.dateOfIncorporation}
                onChange={(event) =>
                  update({
                    organisation: {
                      ...current.organisation,
                      dateOfIncorporation: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Company PAN">
              <input
                className={inputClass}
                value={current.organisation.pan}
                onChange={(event) =>
                  update({
                    organisation: {
                      ...current.organisation,
                      pan: event.target.value.toUpperCase(),
                    },
                  })
                }
              />
            </Field>
            <Field label="GSTIN">
              <input
                className={inputClass}
                value={current.organisation.gstin}
                onChange={(event) =>
                  update({
                    organisation: {
                      ...current.organisation,
                      gstin: event.target.value.toUpperCase(),
                    },
                  })
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Nature of business">
                <input
                  className={inputClass}
                  value={current.organisation.natureOfBusiness}
                  onChange={(event) =>
                    update({
                      organisation: {
                        ...current.organisation,
                        natureOfBusiness: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Registered address">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={current.organisation.registeredAddress}
                  onChange={(event) =>
                    update({
                      organisation: {
                        ...current.organisation,
                        registeredAddress: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && current.newAccountRequirement && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Account type">
                <select
                  className={inputClass}
                  value={current.newAccountRequirement.accountType}
                  onChange={(event) =>
                    update({
                      newAccountRequirement: {
                        ...current.newAccountRequirement!,
                        accountType: event.target
                          .value as typeof current.newAccountRequirement.accountType,
                      },
                    })
                  }
                >
                  <option value="CURRENT_ACCOUNT">Current account</option>
                  <option value="ESCROW_ACCOUNT">Escrow account</option>
                  <option value="COLLECTION_ACCOUNT">
                    Collection account
                  </option>
                </select>
              </Field>
              <Field label="Preferred branch">
                <select
                  className={inputClass}
                  value={current.newAccountRequirement.preferredBranch}
                  onChange={(event) =>
                    update({
                      newAccountRequirement: {
                        ...current.newAccountRequirement!,
                        preferredBranch: event.target.value,
                      },
                    })
                  }
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch}>{branch}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Services you need
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {serviceOptions.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-medium"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-blue-700"
                      checked={current.newAccountRequirement!.requestedServices.includes(
                        value,
                      )}
                      onChange={() => toggleService(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  People who will use Business Banking
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      proposedNeoBankUsers: [
                        ...current.proposedNeoBankUsers,
                        {
                          id: newId(),
                          fullName: "",
                          email: "",
                          mobileNumber: "",
                          role: "MAKER",
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700"
                >
                  <Plus size={16} /> Add person
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Makers prepare payments. Checkers authorise them.
              </p>

              <div className="mt-4 space-y-3">
                {current.proposedNeoBankUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="grid items-center gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1.2fr_1.4fr_1fr_auto]"
                  >
                    <input
                      className={inputClass}
                      placeholder="Full name"
                      value={user.fullName}
                      onChange={(event) =>
                        setUser(index, { fullName: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Work email"
                      value={user.email}
                      onChange={(event) =>
                        setUser(index, { email: event.target.value })
                      }
                    />
                    <select
                      className={inputClass}
                      value={user.role}
                      onChange={(event) =>
                        setUser(index, {
                          role: event.target.value as NeoBankUserRole,
                        })
                      }
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {humanise(role)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label="Remove person"
                      onClick={() =>
                        update({
                          proposedNeoBankUsers:
                            current.proposedNeoBankUsers.filter(
                              (item) => item.id !== user.id,
                            ),
                        })
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                How many checkers must approve?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Any of your {checkerCount || "nominated"} checkers can approve,
                in any order.
              </p>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Field label="Adding a beneficiary">
                  <select
                    className={inputClass}
                    value={Math.min(beneficiaryApprovals, approvalChoices.length)}
                    onChange={(event) =>
                      setBeneficiaryApprovals(Number(event.target.value))
                    }
                  >
                    {approvalChoices.map((count) => (
                      <option key={count} value={count}>
                        {count} checker{count > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Making a payment">
                  <select
                    className={inputClass}
                    value={Math.min(paymentApprovals, approvalChoices.length)}
                    onChange={(event) =>
                      setPaymentApprovals(Number(event.target.value))
                    }
                  >
                    {approvalChoices.map((count) => (
                      <option key={count} value={count}>
                        {count} checker{count > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Authorised signatories
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      authorisedSignatories: [
                        ...current.authorisedSignatories,
                        {
                          id: newId(),
                          fullName: "",
                          designation: "",
                          email: "",
                          mobileNumber: "",
                          pan: "",
                          authority: "BOTH",
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700"
                >
                  <Plus size={16} /> Add signatory
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {current.authorisedSignatories.map((signatory, index) => (
                  <div
                    key={signatory.id}
                    className="grid items-center gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
                  >
                    <input
                      className={inputClass}
                      placeholder="Full name"
                      value={signatory.fullName}
                      onChange={(event) =>
                        setSignatory(index, { fullName: event.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Designation"
                      value={signatory.designation}
                      onChange={(event) =>
                        setSignatory(index, {
                          designation: event.target.value,
                        })
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="PAN"
                      value={signatory.pan}
                      onChange={(event) =>
                        setSignatory(index, {
                          pan: event.target.value.toUpperCase(),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove signatory"
                      onClick={() =>
                        update({
                          authorisedSignatories:
                            current.authorisedSignatories.filter(
                              (item) => item.id !== signatory.id,
                            ),
                        })
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === 3 && (
          <ul className="space-y-3">
            {documentOptions.map(([type, label]) => {
              const document = current.documents.find(
                (item) => item.documentType === type,
              );

              return (
                <li
                  key={type}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {document ? document.fileName : "PDF or image, up to 5 MB"}
                    </p>
                  </div>

                  <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    {document ? "Replace" : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) attachDocument(type, file.name);
                      }}
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {step === 4 && (
          <div>
            <ApplicationSummary
              application={withRules(current)}
            />

            <label className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-blue-700"
                checked={declared}
                onChange={(event) => {
                  setDeclared(event.target.checked);
                  setErrors([]);
                }}
              />
              I confirm that the information is correct and I am authorised to
              apply on behalf of this company. I agree that X Corp may share it
              with its banking partners to open the account.
            </label>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 0 || isBusy}
            onClick={() => {
              setStep(step - 1);
              setErrors([]);
            }}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleContinue()}
              className="rounded-xl bg-blue-700 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {isBusy ? "Saving..." : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleSubmit()}
              className="rounded-xl bg-blue-700 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {isBusy ? "Submitting..." : "Submit application"}
            </button>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

export default ApplyPage;
