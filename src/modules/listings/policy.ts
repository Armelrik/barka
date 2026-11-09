import type { ListingStatus } from "@/generated/prisma/client";
import type { listingActions } from "./validation";
export const transitions: Record<
  (typeof listingActions)[number],
  readonly ListingStatus[]
> = {
  SUBMIT: ["DRAFT", "SUSPENDED", "EXPIRED"],
  REVIEW: ["SUBMITTED"],
  APPROVE: ["VERIFYING"],
  PUBLISH: ["APPROVED"],
  REJECT: ["SUBMITTED", "VERIFYING", "APPROVED"],
  SUSPEND: ["PUBLISHED"],
  ARCHIVE: [
    "DRAFT",
    "SUBMITTED",
    "VERIFYING",
    "APPROVED",
    "PUBLISHED",
    "SUSPENDED",
    "EXPIRED",
  ],
};
export const nextStatus = {
  SUBMIT: "SUBMITTED",
  REVIEW: "VERIFYING",
  APPROVE: "APPROVED",
  PUBLISH: "PUBLISHED",
  REJECT: "DRAFT",
  SUSPEND: "SUSPENDED",
  ARCHIVE: "ARCHIVED",
} as const;
export const publicKinds = [
  "PHOTO",
  "PANORAMA",
  "MODEL_3D",
  "FLOOR_PLAN",
] as const;
