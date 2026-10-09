import { mockModesOfOperation } from "../mock-data/mop";
import type {
  ModeOfOperation,
  OperationType,
} from "../types/approval";

function delay(milliseconds = 400) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
}

function isDateWithinEffectivePeriod(
  mop: ModeOfOperation,
  asOfDate: Date,
): boolean {
  const effectiveFrom = new Date(mop.effectiveFrom);

  if (asOfDate < effectiveFrom) {
    return false;
  }

  if (!mop.effectiveTo) {
    return true;
  }

  const effectiveTo = new Date(mop.effectiveTo);

  return asOfDate <= effectiveTo;
}

function validateMopConfiguration(
  mop: ModeOfOperation,
): void {
  if (mop.stages.length === 0) {
    throw new Error(
      "The applicable MOP does not contain any approval stages.",
    );
  }

  const sortedStages = [...mop.stages].sort(
    (first, second) =>
      first.sequence - second.sequence,
  );

  sortedStages.forEach((stage, index) => {
    const expectedSequence = index + 1;

    if (stage.sequence !== expectedSequence) {
      throw new Error(
        "The applicable MOP contains an invalid stage sequence.",
      );
    }

    if (stage.requiredApprovals < 1) {
      throw new Error(
        `MOP stage "${stage.stageName}" must require at least one approval.`,
      );
    }

    const uniqueEligibleUserIds = new Set(
      stage.eligibleUserIds,
    );

    if (
      uniqueEligibleUserIds.size <
      stage.requiredApprovals
    ) {
      throw new Error(
        `MOP stage "${stage.stageName}" does not have enough eligible authorisers.`,
      );
    }
  });
}

export async function getApplicableMop(
  organisationId: string,
  operationType: OperationType,
  asOfDate = new Date(),
): Promise<ModeOfOperation> {
  await delay();

  const applicableMops = mockModesOfOperation
    .filter(
      (mop) =>
        mop.organisationId === organisationId &&
        mop.operationType === operationType &&
        mop.status === "ACTIVE" &&
        isDateWithinEffectivePeriod(mop, asOfDate),
    )
    .sort(
      (first, second) =>
        second.version - first.version,
    );

  const applicableMop = applicableMops[0];

  if (!applicableMop) {
    throw new Error(
      `No active MOP is configured for ${operationType}.`,
    );
  }

  validateMopConfiguration(applicableMop);

  return {
    ...applicableMop,
    stages: [...applicableMop.stages]
      .sort(
        (first, second) =>
          first.sequence - second.sequence,
      )
      .map((stage) => ({
        ...stage,
        eligibleUserIds: [...stage.eligibleUserIds],
      })),
  };
}

export async function getMopByVersion(
  mopId: string,
  version: number,
): Promise<ModeOfOperation> {
  await delay();

  const mop = mockModesOfOperation.find(
    (item) =>
      item.id === mopId &&
      item.version === version,
  );

  if (!mop) {
    throw new Error(
      "The applied MOP version could not be found.",
    );
  }

  validateMopConfiguration(mop);

  return {
    ...mop,
    stages: [...mop.stages]
      .sort(
        (first, second) =>
          first.sequence - second.sequence,
      )
      .map((stage) => ({
        ...stage,
        eligibleUserIds: [...stage.eligibleUserIds],
      })),
  };
}

export async function getMopsByOrganisation(
  organisationId: string,
): Promise<ModeOfOperation[]> {
  await delay();

  return mockModesOfOperation
    .filter(
      (mop) =>
        mop.organisationId === organisationId,
    )
    .sort(
      (first, second) =>
        first.operationType.localeCompare(
          second.operationType,
        ) || second.version - first.version,
    )
    .map((mop) => ({
      ...mop,
      stages: [...mop.stages]
        .sort(
          (first, second) =>
            first.sequence - second.sequence,
        )
        .map((stage) => ({
          ...stage,
          eligibleUserIds: [
            ...stage.eligibleUserIds,
          ],
        })),
    }));
}
