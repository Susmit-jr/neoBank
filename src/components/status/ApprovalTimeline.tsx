import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getApprovalTimeline } from "../../services/approvalService";
import { formatDateTime } from "../../utils/dates";

type ApprovalTimelineProps = {
  requestId: string;
  createdByName: string;
  createdAt: string;
};

function ApprovalTimeline({
  requestId,
  createdByName,
  createdAt,
}: ApprovalTimelineProps) {
  const stages = getApprovalTimeline(requestId);

  return (
    <div>
      <h4 className="text-base font-semibold text-slate-950">
        Authorisation progress
      </h4>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">
          Initiated by {createdByName}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {formatDateTime(createdAt)}
        </p>
      </div>

      {stages.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No authorisation is required for this request.
        </p>
      )}

      {stages.map((stage) => (
        <div
          key={stage.sequence}
          className="mt-4 rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">
              {stage.stageName}
            </p>
            <span className="text-xs font-semibold text-slate-600">
              {stage.approvedCount} of{" "}
              {stage.requiredApprovals} authorised
            </span>
          </div>

          <ul className="mt-4 space-y-3">
            {stage.authorisers.map((authoriser) => (
              <li
                key={authoriser.userId}
                className="flex items-start gap-3"
              >
                {authoriser.status === "APPROVED" ? (
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 text-emerald-600"
                  />
                ) : authoriser.status === "PENDING" ? (
                  <Clock3
                    size={18}
                    className={`mt-0.5 ${stage.status === "COMPLETED" ? "text-slate-300" : "text-amber-500"}`}
                  />
                ) : (
                  <XCircle
                    size={18}
                    className="mt-0.5 text-red-600"
                  />
                )}

                <div className="text-sm">
                  <p className="font-semibold text-slate-900">
                    {authoriser.name}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {authoriser.role}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {authoriser.status === "APPROVED"
                      ? `Authorised on ${formatDateTime(authoriser.actedAt ?? "")}`
                      : authoriser.status === "PENDING"
                        ? stage.status === "COMPLETED"
                          ? "Not required, authorisation complete"
                          : "Authorisation pending"
                        : `${authoriser.status === "REJECTED" ? "Rejected" : "Returned"} on ${formatDateTime(authoriser.actedAt ?? "")}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ApprovalTimeline;
