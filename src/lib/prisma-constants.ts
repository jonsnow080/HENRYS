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
  IN_REVIEW: "IN_REVIEW",
  WAITLIST: "WAITLIST",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const RsvpStatus = {
  GOING: "GOING",
  WAITLISTED: "WAITLISTED",
  CANCELED: "CANCELED",
} as const;

export type RsvpStatus = (typeof RsvpStatus)[keyof typeof RsvpStatus];
