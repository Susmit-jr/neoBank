import { useState } from "react";
import {
  cancelRequest,
  getApprovalTimeline,
  type RequestKind,
} from "../../services/approvalService";
import { useAuth } from "../../store/AuthContext";

const OPEN_STATUSES = [
  "PENDING_AUTHORISATION",
  "AUTHORISATION_IN_PROGRESS",
  "AWAITING_NEXT_AUTHORISER",
];

type CancelRequestButtonProps = {
  requestKind: RequestKind;
  requestId: string;
  createdByUserId: string;
  status: string;
  onCancelled: () => void;
};

function CancelRequestButton({
  requestKind,
  requestId,
  createdByUserId,
  status,
  onCancelled,
}: CancelRequestButtonProps) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const noCheckerHasActed = getApprovalTimeline(
    requestId,
  ).every((stage) =>
    stage.authorisers.every(
      (authoriser) => authoriser.status === "PENDING",
    ),
  );

  if (
    user?.id !== createdByUserId ||
    !OPEN_STATUSES.includes(status) ||
    !noCheckerHasActed
  ) {
    return null;
  }

  async function handleCancel() {
    try {
      await cancelRequest({
        requestKind,
        requestId,
        cancelledByUserId: createdByUserId,
      });
      onCancelled();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "The request could not be cancelled.",
      );
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm font-semibold text-red-700 hover:text-red-800"
        >
          Cancel this request
        </button>
      ) : (
        <div>
          <p className="text-sm text-slate-700">
            Cancel this request? No checker has acted on it yet.
            You can create it again later.
          </p>

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => void handleCancel()}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Yes, cancel request
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Keep request
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

export default CancelRequestButton;
