import { useCallback, useEffect, useState } from "react";
import { getApprovalTrayItemsNow } from "../../services/approvalService";
import { getDashboardSnapshot } from "../../services/dashboardService";
import { getMockDatabase } from "../../services/mockDatabase";
import type { AuthenticatedUser } from "../../types/auth";
import { formatCurrency } from "../../utils/currency";

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  at: string;
  to: string;
  actionable: boolean;
};

export type Notifications = {
  pendingApprovals: number;
  items: AppNotification[];
  badge: number;
  markSeen: () => void;
};

const RECENT_DAYS = 7;

const typeLabels = {
  PAYMENT: "Payment",
  BENEFICIARY: "Beneficiary",
  FUNDING: "Add balance",
} as const;

function seenKey(userId: string) {
  return `neobank_notifications_seen_${userId}`;
}

function readSeen(userId: string): number {
  try {
    return Number(localStorage.getItem(seenKey(userId)) ?? 0);
  } catch {
    return 0;
  }
}

function compute(user: AuthenticatedUser, seenAt: number) {
  const items: AppNotification[] = [];
  let pendingApprovals = 0;

  if (user.portal === "MERCHANT" && user.organisationId) {
    const tray = getApprovalTrayItemsNow(user.organisationId, user.id);
    pendingApprovals = tray.length;

    tray.forEach((item) =>
      items.push({
        id: `tray-${item.approvalStage.id}`,
        title: `${typeLabels[item.requestType]} waiting for your approval`,
        detail: `${item.requestReference}${item.amount !== undefined ? ` · ${formatCurrency(item.amount)}` : ""}`,
        at: item.submittedAt,
        to: `/merchant/approvals?requestId=${item.requestId}`,
        actionable: true,
      }),
    );

    // Outcomes of the requests this user raised.
    const database = getMockDatabase();
    const since = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

    const update = (
      id: string,
      title: string,
      reference: string,
      at: string | undefined,
      to: string,
    ) => {
      if (at && new Date(at).getTime() > since) {
        items.push({ id, title, detail: reference, at, to, actionable: false });
      }
    };

    database.payments
      .filter((item) => item.createdByUserId === user.id)
      .forEach((item) => {
        if (item.status === "REJECTED")
          update(`pay-r-${item.id}`, "Payment rejected by a checker", item.paymentReference, item.rejectedAt, "/merchant/payments");
        if (item.status === "SUCCESSFUL")
          update(`pay-s-${item.id}`, "Payment completed", item.paymentReference, item.completedAt, "/merchant/payments");
        if (item.status === "FAILED")
          update(`pay-f-${item.id}`, "Payment failed", item.paymentReference, item.failedAt, "/merchant/payments");
      });

    database.beneficiaries
      .filter((item) => item.createdByUserId === user.id)
      .forEach((item) => {
        if (item.status === "REJECTED")
          update(`ben-r-${item.id}`, "Beneficiary rejected by a checker", item.beneficiaryReference, item.rejectedAt, "/merchant/beneficiaries");
        if (item.status === "ACTIVE")
          update(`ben-a-${item.id}`, "Beneficiary approved", item.beneficiaryReference, item.activatedAt, "/merchant/beneficiaries");
      });

    database.fundingRequests
      .filter((item) => item.createdByUserId === user.id)
      .forEach((item) => {
        if (item.status === "REJECTED")
          update(`fund-r-${item.id}`, "Add balance rejected by a checker", item.fundingReference, item.rejectedAt, "/merchant/add-balance");
        if (item.status === "SUCCESSFUL")
          update(`fund-s-${item.id}`, "Balance added to your account", item.fundingReference, item.completedAt, "/merchant/add-balance");
      });
  }

  const snapshot =
    user.portal === "MERCHANT" ? null : getDashboardSnapshot();

  if (snapshot && user.portal === "PLATFORM_ADMIN" && snapshot.awaitingNeoBank) {
    items.push({
      id: "apps-neobank",
      title: `${snapshot.awaitingNeoBank} application(s) waiting for review`,
      detail: "New business applications",
      at: new Date().toISOString(),
      to: "/platform-admin/onboarding",
      actionable: true,
    });
  }

  if (snapshot && user.portal === "BANK_ADMIN" && snapshot.awaitingBank) {
    items.push({
      id: "apps-bank",
      title: `${snapshot.awaitingBank} application(s) waiting for approval`,
      detail: "Sent by X Corp",
      at: new Date().toISOString(),
      to: "/bank-admin/onboarding",
      actionable: true,
    });
  }

  items.sort(
    (first, second) =>
      Number(second.actionable) - Number(first.actionable) ||
      new Date(second.at).getTime() - new Date(first.at).getTime(),
  );

  const unread = items.filter(
    (item) => !item.actionable && new Date(item.at).getTime() > seenAt,
  ).length;

  return {
    pendingApprovals,
    items,
    badge: items.filter((item) => item.actionable).length + unread,
  };
}

export function useNotifications(user: AuthenticatedUser | null): Notifications {
  const [seenAt, setSeenAt] = useState(() =>
    user ? readSeen(user.id) : 0,
  );
  const [state, setState] = useState(() =>
    user
      ? compute(user, seenAt)
      : { pendingApprovals: 0, items: [] as AppNotification[], badge: 0 },
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const refresh = () => setState(compute(user, seenAt));
    refresh();

    const timer = window.setInterval(refresh, 2000);
    return () => window.clearInterval(timer);
  }, [user, seenAt]);

  const markSeen = useCallback(() => {
    if (!user) {
      return;
    }

    const now = Date.now();

    try {
      localStorage.setItem(seenKey(user.id), String(now));
    } catch {
      // Unread state just resets on the next load.
    }

    setSeenAt(now);
  }, [user]);

  return { ...state, markSeen };
}
