import { z } from "zod";

export const dealBreakerOptions = [
  "Smoking",
  "Heavy drinking",
  "Polyamory",
  "Drug use",
  "No long-term vision",
  "Not open to travel",
  "Political extremes",
  "Poor communication",
] as const;

export const vibeScaleCopy = [
  "Chill",
  "Balanced",
  "High-energy",
] as const;

const optionalTrimmedString = (options: { max: number; emptyValue?: null }) =>
  z
    .union([z.string(), z.undefined()])
    .transform((value) => (value ?? "").trim())
    .refine((value) => value.length <= options.max, {
      message: `Must be ${options.max} characters or fewer`,
    })
    .transform((value) => (value.length === 0 ? options.emptyValue ?? null : value));

const optionalLinkedInProfile = z
  .union([z.string(), z.undefined()])
  .transform((value) => (value ?? "").trim())
  .refine((value) => value.length === 0 || isValidLinkedInProfileUrl(value), {
    message: "Enter a valid LinkedIn profile URL",
  })
  .transform((value) => (value.length === 0 ? null : value));

const optionalInstagramProfile = z
  .union([z.string(), z.undefined()])
  .transform((value) => (value ?? "").trim())
  .refine((value) => value.length === 0 || isValidInstagramProfileUrl(value), {
    message: "Enter a valid Instagram profile URL",
  })
  .transform((value) => (value.length === 0 ? null : value));

const consentField = (message: string) =>
  z
    .union([z.string(), z.undefined()])
    .transform((value) => (value ?? "").trim())
    .refine((value) => value === "on", { message })
    .transform(() => true as const);

export const applicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .refine((value) => /\s/.test(value), {
      message: "Enter your first and last name",
    }),
  email: z
    .string()
    .trim()
    .min(1, "An email is required")
    .email("Enter a valid email")
    .refine((value) => value.toLowerCase().endsWith("@gmail.com"), {
      message: "Use a personal Gmail address",
    }),
  age: z
    .string()
    .trim()
    .refine((value) => value.length > 0, { message: "Age is required" })
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value), { message: "Age must be a whole number" })
    .refine((value) => value >= 18, {
      message: "You must be at least 18",
    })
    .refine((value) => value <= 999, {
      message: "Age must be 3 digits or less",
    }),
  city: z
    .string()
    .trim()
    .refine((value) => value.length > 0, { message: "City is required" }),
  occupation: z
    .string()
    .trim()
    .refine((value) => value.length > 0, { message: "Tell us what you do" })
    .refine((value) => value.split(/\s+/).filter(Boolean).length <= 3, {
      message: "Keep it to 3 words or fewer",
    }),
  linkedin: optionalLinkedInProfile,
  instagram: optionalInstagramProfile,
  motivation: z.string().trim().min(40, "Give us at least a couple of sentences"),
  threeWords: z.string().trim().min(3, "Add at least three words"),
  perfectSaturday: z
    .string()
    .trim()
    .min(30, "We love details — give us at least 30 characters"),
  dietary: optionalTrimmedString({ max: 160, emptyValue: null }),
  dietaryNotes: optionalTrimmedString({ max: 200, emptyValue: null }),
  alcohol: z.string().trim().min(2, "Let us know your preferences"),
  vibe: z
    .string()
    .trim()
    .refine((value) => value.length > 0, { message: "Pick a vibe" })
    .transform((value) => Number(value))
    .refine((value) => value >= 1 && value <= 10, {
      message: "Choose between 1 and 10",
    }),
  availability: optionalTrimmedString({ max: 200, emptyValue: null }),
  dealBreakers: z
    .array(z.enum(dealBreakerOptions))
    .optional()
    .transform((value) => value ?? []),
  consentCode: consentField("You must accept the code of conduct"),
  consentData: consentField("You must consent to data use"),
});

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidLinkedInProfileUrl(value: string): boolean {
  if (!isValidUrl(value)) {
    return false;
  }

  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (!(hostname === "linkedin.com" || hostname.endsWith(".linkedin.com"))) {
    return false;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return false;
  }

  const category = segments[0]?.toLowerCase();
  const allowedCategories = new Set(["in", "company", "school", "showcase", "pub", "profile"]);
  return Boolean(category && allowedCategories.has(category) && segments[1]?.length);
}

function isValidInstagramProfileUrl(value: string): boolean {
  if (!isValidUrl(value)) {
    return false;
  }

  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (!(hostname === "instagram.com" || hostname.endsWith(".instagram.com"))) {
    return false;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) {
    return false;
  }

  const username = segments[0] ?? "";
  const usernamePattern = /^(?!.*\.{2})[a-z0-9._]{1,30}$/i;
  const reservedNames = new Set(["accounts", "developer", "directory", "explore", "stories", "about"]);
  return usernamePattern.test(username) && !reservedNames.has(username.toLowerCase());
}

export type ApplicationFormInput = z.infer<typeof applicationSchema>;
