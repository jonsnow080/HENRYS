import { ApplicationStatus } from "@/lib/prisma-constants";

export const STATUS_OPTIONS = Object.values(ApplicationStatus);

export const SORT_OPTIONS = ["newest", "oldest", "name", "status"] as const;

export const AGE_BANDS = [
  { value: "under25", label: "Under 25", test: (age?: number) => typeof age === "number" && age < 25 },
  { value: "25-34", label: "25-34", test: (age?: number) => typeof age === "number" && age >= 25 && age <= 34 },
  { value: "35-44", label: "35-44", test: (age?: number) => typeof age === "number" && age >= 35 && age <= 44 },
  { value: "45+", label: "45+", test: (age?: number) => typeof age === "number" && age >= 45 },
  { value: "unknown", label: "Unknown", test: (age?: number) => typeof age !== "number" },
] as const;

export type AgeBandValue = (typeof AGE_BANDS)[number]["value"];

export function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case ApplicationStatus.SUBMITTED:
      return "Submitted";
    case ApplicationStatus.IN_REVIEW:
      return "In review";
    case ApplicationStatus.WAITLIST:
      return "Waitlist";
    case ApplicationStatus.APPROVED:
      return "Approved";
    case ApplicationStatus.REJECTED:
      return "Rejected";
    default:
      return status;
  }
}
