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

const optionalUrl = z
  .union([z.string(), z.undefined()])
  .transform((value) => (value ?? "").trim())
  .refine((value) => value.length === 0 || isValidUrl(value), {
    message: "Must be a valid URL",
  });

export const applicationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "An email is required").email("Enter a valid email"),
  age: z
    .string()
    .trim()
    .refine((value) => value.length > 0, { message: "Age is required" })
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value), { message: "Age must be a whole number" })
    .refine((value) => value >= 25 && value <= 38, {
      message: "HENRYS is for ages 25–38",
    }),
  city: z.string().min(2, "City must be at least 2 characters"),
  occupation: z.string().min(2, "Occupation must be at least 2 characters"),
  linkedin: optionalUrl,
  instagram: optionalUrl,
  motivation: z.string().min(40, "Give us at least a couple of sentences"),
  threeWords: z.string().min(3, "Add at least three words"),
  perfectSaturday: z.string().min(30, "We love details — give us at least 30 characters"),
  dietary: z.string().max(160).optional().or(z.literal("")),
  dietaryNotes: z.string().max(200).optional().or(z.literal("")),
  alcohol: z.string().min(2, "Let us know your preferences"),
  vibe: z
    .string()
    .trim()
    .refine((value) => value.length > 0, { message: "Pick a vibe" })
    .transform((value) => Number(value))
    .refine((value) => value >= 1 && value <= 10, {
      message: "Choose between 1 and 10",
    }),
  availability: z.string().max(200).optional().or(z.literal("")),
  dealBreakers: z
    .array(z.enum(dealBreakerOptions))
    .optional()
    .transform((value) => value ?? []),
  consentCode: z
    .string()
    .optional()
    .refine((value) => value === "on", {
      message: "You must accept the code of conduct",
    })
    .transform(() => "on" as const),
  consentData: z
    .string()
    .optional()
    .refine((value) => value === "on", {
      message: "You must consent to data use",
    })
    .transform(() => "on" as const),
});

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export type ApplicationFormInput = z.infer<typeof applicationSchema>;
