export function humanise(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_NEOBANK_REVIEW: "With X Corp",
  SUBMITTED_TO_BANK: "With IndusInd Bank",
  UNDER_BANK_REVIEW: "With IndusInd Bank",
  ACCOUNT_OPENED: "Account opened",
  ACCOUNT_LINKED: "Account opened",
  REJECTED: "Rejected",
};

export function statusLabel(status: string): string {
  return statusLabels[status] ?? humanise(status);
}

export const branches = [
  "Mumbai Corporate Branch",
  "Delhi Connaught Place",
  "Bengaluru MG Road",
  "Chennai Anna Salai",
];

export const serviceOptions = [
  ["CORPORATE_NET_BANKING", "Business Banking portal"],
  ["PAYMENTS", "Payments"],
  ["COLLECTIONS", "Collections"],
  ["BULK_PAYMENTS", "Bulk payments"],
  ["TAX_PAYMENTS", "Tax payments"],
  ["API_BANKING", "API banking"],
] as const;

export const documentOptions = [
  ["PAN", "Company PAN card"],
  ["GST_CERTIFICATE", "GST certificate"],
  ["INCORPORATION_DOCUMENT", "Certificate of incorporation"],
  ["BOARD_RESOLUTION", "Board resolution"],
  ["AUTHORISED_SIGNATORY_DOCUMENT", "Authorised signatory document"],
] as const;
