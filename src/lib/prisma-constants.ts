export const Role = {
  GUEST: "GUEST",
  APPLICANT: "APPLICANT",
  MEMBER: "MEMBER",
  HOST: "HOST",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ApplicationStatus = {
  SUBMITTED: "SUBMITTED",
  WAITLIST: "WAITLIST",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];
