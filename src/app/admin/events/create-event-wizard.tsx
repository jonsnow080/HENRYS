"use client";
/* eslint-disable @next/next/no-img-element */

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Controller, FieldPath, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Check, Circle, CircleDot, Monitor, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { EMAIL_CONTACTS } from "@/lib/site/emails";
import { useToast } from "@/components/ui/use-toast";
import { createEventAction, type CreateEventState } from "./actions";

const CATEGORIES = [
  "Arts & Culture",
  "Business & Networking",
  "Community",
  "Education",
  "Fashion",
  "Food & Drink",
  "Health & Wellness",
  "Music",
  "Sports",
  "Technology",
  "Travel",
] as const;

const RECURRENCE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

const DEFAULT_SHARE_CHANNELS = [
  { label: "Email", channel: "email" },
  { label: "Facebook", channel: "facebook" },
  { label: "Instagram", channel: "instagram" },
  { label: "LinkedIn", channel: "linkedin" },
  { label: "X", channel: "x" },
] as const;

const DEFAULT_ATTENDEE_FIELDS = [
  { label: "Full name", type: "text", required: true },
  { label: "Email", type: "email", required: true },
] as const;

const STEP_ORDER = [
  "basics",
  "dateTime",
  "location",
  "registration",
  "media",
  "visibility",
  "advanced",
  "review",
] as const;

type StepKey = (typeof STEP_ORDER)[number];


const recurrenceSchema = z
  .object({
    frequency: z.enum(RECURRENCE_FREQUENCIES),
    interval: z.number().int().min(1).max(365).default(1),
    byWeekday: z.array(
      z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const),
    ),
    ends: z.enum(["never", "until", "count"]).default("never"),
    until: z.string().optional(),
    count: z.number().int().min(1).max(365).optional(),
  })
  .optional();

const ticketTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Enter a ticket name."),
  price: z.number().min(0, "Price cannot be negative."),
  currency: z.string().min(1, "Pick a currency."),
  quantity: z.number().int().min(0, "Quantity cannot be negative."),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
  minPerOrder: z.number().int().min(1, "Minimum must be at least 1."),
  maxPerOrder: z.number().int().min(1, "Maximum must be at least 1."),
  absorbFees: z.boolean(),
  earlyBirdTiers: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1, "Label required."),
        price: z.number().min(0, "Price must be positive."),
        endsAt: z.string().optional(),
      }),
    )
    .max(3, "Limit early-bird tiers to three."),
});

type TicketType = z.infer<typeof ticketTypeSchema>;

type AttendeeQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string;
};

const formSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
    tagline: z.string().max(160, "Tagline must be under 160 characters.").optional().or(z.literal("")),
    description: z.string().optional(),
    category: z.enum(CATEGORIES, {
      message: "Select a category.",
    }),
    tags: z.array(z.string().min(1)).max(10, "Add up to 10 tags."),
    organizerName: z.string().min(1, "Organizer name required."),
    contactEmail: z.string().email("Enter a valid email."),
    contactPhone: z.string().optional().or(z.literal("")),
    timeZone: z.string().min(1, "Select a time zone."),
    allDay: z.boolean(),
    startDateTime: z.string().min(1, "Start time required."),
    endDateTime: z.string().min(1, "End time required."),
    dateType: z.enum(["single", "multi", "recurring"] as const),
    recurrence: recurrenceSchema,
    agenda: z.array(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Session title required."),
        start: z.string().min(1, "Start time required."),
        end: z.string().min(1, "End time required."),
        speakers: z.string().optional().or(z.literal("")),
      }),
    ),
    locationType: z.enum(["in-person", "online", "hybrid"] as const),
    venueName: z.string().optional().or(z.literal("")),
    venueAddress: z.string().optional().or(z.literal("")),
    venueCity: z.string().optional().or(z.literal("")),
    venueState: z.string().optional().or(z.literal("")),
    venuePostalCode: z.string().optional().or(z.literal("")),
    venueCountry: z.string().optional().or(z.literal("")),
    onlinePlatform: z.string().optional().or(z.literal("")),
    joinUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
    meetingId: z.string().optional().or(z.literal("")),
    passcode: z.string().optional().or(z.literal("")),
    showJoinLinkToRegisteredOnly: z.boolean(),
    registrationMode: z.enum(["rsvp", "ticketing"] as const),
    ticketTypes: z.array(ticketTypeSchema),
    promoCodes: z.array(
      z.object({
        id: z.string(),
        code: z.string().min(1, "Code required."),
        discountType: z.enum(["amount", "percent"] as const),
        value: z.number().min(0, "Value must be positive."),
        maxRedemptions: z.number().int().min(1).optional(),
      }),
    ),
    groupDiscounts: z.array(
      z.object({
        id: z.string(),
        label: z.string().min(1, "Label required."),
        minimum: z.number().int().min(2, "Minimum must be at least 2."),
        discountPercent: z.number().min(1).max(100, "Discount must be between 1 and 100."),
      }),
    ),
    waitlistEnabled: z.boolean(),
    waitlistCapacity: z.number().int().min(1).max(10000).optional(),
    waitlistAutoPromote: z.boolean(),
    attendeeQuestions: z.array(
      z.object({
        id: z.string(),
        label: z.string().min(1, "Question label required."),
        type: z.enum(["text", "textarea", "select"] as const),
        required: z.boolean(),
        options: z.string().optional().or(z.literal("")),
      }),
    ),
    consentAccepted: z.literal(true, { message: "Consent is required." }),
    themeColor: z.string().optional().or(z.literal("")),
    organizerLogo: z.any().optional(),
    sponsorLogos: z.any().optional(),
    attachments: z.any().optional(),
    coverImage: z.any().optional(),
    coverCrop: z.object({ aspect: z.enum(["16:9", "1:1"] as const), zoom: z.number(), x: z.number(), y: z.number() }),
    gallery: z.any().optional(),
    privacy: z.enum(["public", "unlisted", "private"] as const),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters.")
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only."),
    metaTitle: z.string().min(1, "Meta title required.").max(70, "Meta title should be 70 characters or less."),
    metaDescription: z
      .string()
      .min(1, "Meta description required.")
      .max(160, "Meta description should be 160 characters or less."),
    ogImage: z.any().optional(),
    enableSchema: z.boolean(),
    noindex: z.boolean(),
    shareBaseUrl: z.string().url("Provide a valid base URL.").optional().or(z.literal("")),
    shareChannels: z.array(z.string()),
    utmSource: z.string().optional().or(z.literal("")),
    utmMedium: z.string().optional().or(z.literal("")),
    utmCampaign: z.string().optional().or(z.literal("")),
    coHosts: z.array(
      z.object({
        id: z.string(),
        email: z.string().email("Enter a valid email."),
        role: z.enum(["Coordinator", "Editor", "Viewer"] as const),
      }),
    ),
    approvalWorkflow: z.boolean(),
    duplicateWarning: z.boolean(),
    generateIcs: z.boolean(),
    ageRestriction: z.string().optional().or(z.literal("")),
    accessibilityNotes: z.string().optional().or(z.literal("")),
    schedulePublishAt: z.string().optional().or(z.literal("")),
    previewMode: z.enum(["desktop", "mobile"] as const),
  })
  .superRefine((values, ctx) => {
    if (!values.tags || values.tags.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tags"],
        message: "Add at least one tag.",
      });
    }
    if (values.startDateTime && values.endDateTime) {
      if (new Date(values.endDateTime).getTime() <= new Date(values.startDateTime).getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDateTime"],
          message: "End time must be after the start.",
        });
      }
    }
    if (values.registrationMode === "ticketing" && values.ticketTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ticketTypes"],
        message: "Add at least one ticket type.",
      });
    }
    if (values.waitlistEnabled && !values.waitlistCapacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["waitlistCapacity"],
        message: "Provide a waitlist capacity.",
      });
    }
    if (values.recurrence && values.dateType !== "recurring") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence"],
        message: "Recurrence only applies to recurring events.",
      });
    }
    if (values.recurrence?.ends === "until" && !values.recurrence.until) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence", "until"],
        message: "Select an end date.",
      });
    }
    if (values.recurrence?.ends === "count" && !values.recurrence.count) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence", "count"],
        message: "Enter number of occurrences.",
      });
    }
  });

type FormValues = z.input<typeof formSchema>;

type AutosaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; timestamp: number }
  | { status: "error"; message: string };

const stepCopy: Record<StepKey, { title: string; description: string }> = {
  basics: {
    title: "Basics",
    description: "Set the essentials that define your event's identity.",
  },
  dateTime: {
    title: "Date & Time",
    description: "Choose when it happens—including advanced recurrence.",
  },
  location: {
    title: "Location",
    description: "Share how people can join in-person or online.",
  },
  registration: {
    title: "Registration & Tickets",
    description: "Configure attendee flows, ticketing, and forms.",
  },
  media: {
    title: "Media & Branding",
    description: "Upload visuals and set the tone for your event page.",
  },
  visibility: {
    title: "Visibility & SEO",
    description: "Control discoverability and metadata.",
  },
  advanced: {
    title: "Advanced",
    description: "Invite collaborators and fine-tune policies.",
  },
  review: {
    title: "Review & Publish",
    description: "Double-check details and choose how to launch.",
  },
};

const STEP_FIELD_MAP: Record<StepKey, string[]> = {
  basics: ["title", "tagline", "description", "category", "tags", "organizerName", "contactEmail", "contactPhone"],
  dateTime: ["timeZone", "allDay", "startDateTime", "endDateTime", "dateType", "recurrence", "agenda"],
  location: [
    "locationType",
    "venueName",
    "venueAddress",
    "venueCity",
    "venueState",
    "venuePostalCode",
    "venueCountry",
    "onlinePlatform",
    "joinUrl",
    "meetingId",
    "passcode",
    "showJoinLinkToRegisteredOnly",
  ],
  registration: [
    "registrationMode",
    "ticketTypes",
    "promoCodes",
    "groupDiscounts",
    "waitlistEnabled",
    "waitlistCapacity",
    "waitlistAutoPromote",
    "attendeeQuestions",
    "consentAccepted",
  ],
  media: ["coverImage", "coverCrop", "gallery", "themeColor", "organizerLogo", "sponsorLogos", "attachments"],
  visibility: [
    "privacy",
    "slug",
    "metaTitle",
    "metaDescription",
    "ogImage",
    "enableSchema",
    "noindex",
    "shareBaseUrl",
    "shareChannels",
    "utmSource",
    "utmMedium",
    "utmCampaign",
  ],
  advanced: [
    "coHosts",
    "approvalWorkflow",
    "duplicateWarning",
    "generateIcs",
    "ageRestriction",
    "accessibilityNotes",
    "schedulePublishAt",
  ],
  review: ["previewMode"],
};


function getSupportedTimeZones(): string[] {
  try {
    if (typeof Intl !== "undefined" && (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf) {
      return (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone");
    }
  } catch (error) {
    console.error("Unable to load time zones", error);
  }
  return ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Singapore"];
}

function sanitizeRichText(raw: string): string {
  if (typeof window === "undefined" || !raw) return raw;
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");
  doc.querySelectorAll("script, style").forEach((node) => node.remove());
  doc.body.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (attr.name.startsWith("on") || attr.name === "style") {
        node.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML.trim();
}

function findFirstErrorPath(errors: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const child = value[index];
        if (!child) continue;
        if (typeof child === "object" && child !== null) {
          const nested = findFirstErrorPath(child as Record<string, unknown>);
          if (nested) {
            return `${key}.${index}.${nested}`;
          }
          if (typeof (child as { message?: unknown }).message === "string") {
            return `${key}.${index}`;
          }
        } else {
          return `${key}.${index}`;
        }
      }
    } else if (typeof value === "object") {
      const objectValue = value as Record<string, unknown>;
      if (typeof (objectValue as { message?: unknown }).message === "string") {
        return key;
      }
      const nested = findFirstErrorPath(objectValue);
      if (nested) {
        return `${key}.${nested}`;
      }
    } else {
      return key;
    }
  }
  return null;
}

function extractErrorMessage(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = extractErrorMessage(item);
      if (message) return message;
    }
    return null;
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (typeof objectValue.message === "string") {
      return objectValue.message;
    }
    for (const nested of Object.values(objectValue)) {
      const message = extractErrorMessage(nested);
      if (message) return message;
    }
    return null;
  }
  return typeof value === "string" ? value : null;
}

function getStepErrorMessages(step: StepKey, errors: Record<string, unknown>): string[] {
  const relevantFields = STEP_FIELD_MAP[step];
  const messages = new Set<string>();
  for (const field of relevantFields) {
    const pathSegments = field.split(".");
    let current: unknown = errors;
    for (const segment of pathSegments) {
      if (Array.isArray(current)) {
        const index = Number(segment);
        current = Number.isNaN(index) ? undefined : current[index];
      } else if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[segment];
      } else {
        current = undefined;
        break;
      }
    }
    const message = extractErrorMessage(current);
    if (message) {
      messages.add(message);
    }
  }
  return Array.from(messages);
}

function toFormData(values: FormValues): FormData {
  const formData = new FormData();
  formData.set("title", values.title);
  formData.set("summary", values.tagline ?? "");
  formData.set("details", sanitizeRichText(values.description ?? ""));
  formData.set("startAt", values.startDateTime);
  formData.set("endAt", values.endDateTime);
  formData.set("capacity", "0");
  formData.set("price", "0");
  formData.set("visibility", values.privacy === "public" ? "true" : "false");
  formData.set("venueName", values.venueName ?? "");
  formData.set("venueAddress", values.venueAddress ?? "");
  formData.set("venueNotes", values.accessibilityNotes ?? "");
  return formData;
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildRrule(values: FormValues): string | null {
  if (values.dateType !== "recurring" || !values.recurrence) return null;
  const {
    frequency,
    interval = 1,
    byWeekday = [],
    ends = "never",
    until,
    count,
  } = values.recurrence;
  const parts = [`FREQ=${frequency}`, `INTERVAL=${interval}`];
  if (byWeekday.length) {
    parts.push(`BYDAY=${byWeekday.join(",")}`);
  }
  if (ends === "until" && until) {
    parts.push(`UNTIL=${until.replace(/[-:]/g, "").replace("T", "")}`);
  }
  if (ends === "count" && count) {
    parts.push(`COUNT=${count}`);
  }
  return parts.join(";");
}

function coverFileIsValid(file: File | null): { valid: boolean; message?: string } {
  if (!file) return { valid: true };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { valid: false, message: "Cover must be a JPG, PNG, or WEBP." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, message: "Cover image cannot exceed 10MB." };
  }
  return { valid: true };
}


export function CreateEventWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [autosave, setAutosave] = useState<AutosaveState>({ status: "idle" });
  const [actionState, setActionState] = useState<CreateEventState | null>(null);
  const [isPublishing, startPublishTransition] = useTransition();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const timeZones = useMemo(() => getSupportedTimeZones(), []);
  const defaultTimeZone = useMemo(() => {
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    }
    return "UTC";
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      tagline: "",
      description: "",
      category: CATEGORIES[0],
      tags: [],
      organizerName: "",
      contactEmail: "",
      contactPhone: "",
      timeZone: defaultTimeZone,
      allDay: false,
      startDateTime: "",
      endDateTime: "",
      dateType: "single",
      recurrence: undefined,
      agenda: [],
      locationType: "in-person",
      venueName: "",
      venueAddress: "",
      venueCity: "",
      venueState: "",
      venuePostalCode: "",
      venueCountry: "",
      onlinePlatform: "",
      joinUrl: "",
      meetingId: "",
      passcode: "",
      showJoinLinkToRegisteredOnly: true,
      registrationMode: "rsvp",
      ticketTypes: [],
      promoCodes: [],
      groupDiscounts: [],
      waitlistEnabled: false,
      waitlistCapacity: undefined,
      waitlistAutoPromote: true,
      attendeeQuestions: DEFAULT_ATTENDEE_FIELDS.map((field) => ({
        id: generateId("question"),
        label: field.label,
        type: field.type as AttendeeQuestion["type"],
        required: field.required,
        options: "",
      })),
      consentAccepted: true,
      themeColor: "#1d4ed8",
      organizerLogo: null,
      sponsorLogos: [],
      attachments: [],
      coverImage: null,
      coverCrop: { aspect: "16:9", zoom: 1, x: 50, y: 50 },
      gallery: [],
      privacy: "public",
      slug: "",
      metaTitle: "",
      metaDescription: "",
      ogImage: null,
      enableSchema: true,
      noindex: false,
      shareBaseUrl: "",
      shareChannels: DEFAULT_SHARE_CHANNELS.map((channel) => channel.channel),
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      coHosts: [],
      approvalWorkflow: false,
      duplicateWarning: false,
      generateIcs: true,
      ageRestriction: "",
      accessibilityNotes: "",
      schedulePublishAt: "",
      previewMode: "desktop",
    },
  });

  const { control, formState, handleSubmit, register, reset, setValue, trigger, watch } = form;

  const agendaFieldArray = useFieldArray({ control, name: "agenda" });
  const ticketFieldArray = useFieldArray({ control, name: "ticketTypes" });
  const promoFieldArray = useFieldArray({ control, name: "promoCodes" });
  const groupDiscountFieldArray = useFieldArray({ control, name: "groupDiscounts" });
  const attendeeFieldArray = useFieldArray({ control, name: "attendeeQuestions" });
  const coHostFieldArray = useFieldArray({ control, name: "coHosts" });

  const currentStep = STEP_ORDER[activeStepIndex];
  const stepErrors = getStepErrorMessages(currentStep, formState.errors as Record<string, unknown>);
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);

  const values = watch();

  useEffect(() => {
    if (values.title && !slugManuallyEdited) {
      const generated = values.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60);
      setValue("slug", generated, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  }, [setValue, slugManuallyEdited, values.title]);

  useEffect(() => {
    if (values.title && values.startDateTime && (values.venueName || values.joinUrl)) {
      setValue("duplicateWarning", true);
    } else {
      setValue("duplicateWarning", false);
    }
  }, [setValue, values.joinUrl, values.startDateTime, values.title, values.venueName]);

  useEffect(() => {
    if (autosaveRef.current) {
      clearInterval(autosaveRef.current);
    }
    autosaveRef.current = setInterval(() => {
      setAutosave({ status: "saving" });
      setTimeout(() => {
        setAutosave({ status: "saved", timestamp: Date.now() });
      }, 400);
    }, 5000);
    return () => {
      if (autosaveRef.current) {
        clearInterval(autosaveRef.current);
      }
    };
  }, []);

  const closeAndReset = useCallback(() => {
    setOpen(false);
    setActiveStepIndex(0);
    setSlugManuallyEdited(false);
    reset();
    setActionState(null);
    setAutosave({ status: "idle" });
  }, [reset]);

  const focusFirstError = useCallback(() => {
    const firstErrorPath = findFirstErrorPath(formState.errors as Record<string, unknown>);
    if (!firstErrorPath) return;
    const selector = `[name="${firstErrorPath.replace(/\.(\d+)/g, "[$1]")}"]`;
    const node = document.querySelector<HTMLElement>(selector);
    if (node) {
      node.focus();
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [formState.errors]);

  const onSubmit = useCallback(
    (callback: (values: FormValues) => void) =>
      handleSubmit(
        (validValues) => {
          callback(validValues);
        },
        () => {
          focusFirstError();
        },
      ),
    [focusFirstError, handleSubmit],
  );

  const handlePublish = onSubmit((validValues) => {
    const formData = toFormData(validValues);
    const rrule = buildRrule(validValues);
    if (rrule) {
      formData.set("rrule", rrule);
    }
    formData.set("timeZone", validValues.timeZone);
    formData.set("visibility", validValues.privacy === "public" ? "true" : "false");
    setActionState({ status: "success", message: "Publishing..." });
    startPublishTransition(async () => {
      try {
        const nextState = await createEventAction({}, formData);
        setActionState(nextState);
        if (nextState.status === "success" && nextState.eventId) {
          toast({ description: "Event published." });
          closeAndReset();
          router.refresh();
          router.push(`/admin/events/${nextState.eventId}`);
        } else if (nextState.status === "error") {
          toast({
            title: "Error",
            description: nextState.message ?? "Unable to publish event.",
          });
        }
      } catch (error) {
        console.error(error);
        setActionState({ status: "error", message: "An unexpected error occurred." });
        toast({
          title: "Error",
          description: "We couldn't publish the event. Please try again.",
        });
      }
    });
  });

  const handleSaveDraft = onSubmit(() => {
    toast({ description: "Draft saved locally." });
  });

  const handleSchedulePublish = onSubmit((validValues) => {
    if (!validValues.schedulePublishAt) {
      toast({
        title: "Error",
        description: "Add a publish date before scheduling.",
      });
      return;
    }
    toast({ description: "Event scheduled." });
  });

  const renderAutosaveStatus = () => {
    if (autosave.status === "saving") {
      return <span className="text-xs text-muted-foreground">Autosaving…</span>;
    }
    if (autosave.status === "saved") {
      return (
        <span className="text-xs text-muted-foreground">
          Saved {new Date(autosave.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    }
    if (autosave.status === "error") {
      return <span className="text-xs text-destructive">{autosave.message}</span>;
    }
    return <span className="text-xs text-muted-foreground">Draft not yet saved</span>;
  };

  const coverFile = values.coverImage instanceof FileList ? values.coverImage[0] : (values.coverImage as File | null);
  const coverValidation = coverFileIsValid(coverFile ?? null);


  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeAndReset();
        } else {
          setOpen(nextOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-full px-4">Create event</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[1100px] gap-0 overflow-hidden p-0">
        <FormProvider {...form}>
          <div className="flex h-[80vh] flex-col md:flex-row">
            <aside className="hidden w-64 flex-shrink-0 border-r bg-muted/30 p-6 md:flex md:flex-col">
              <h2 className="text-lg font-semibold">Create New Event</h2>
              <p className="mt-1 text-sm text-muted-foreground">{stepCopy[currentStep].description}</p>
              <ol className="mt-6 space-y-3" aria-label="Event creation steps">
                {STEP_ORDER.map((step, index) => {
                  const isActive = index === activeStepIndex;
                  const completed = index < activeStepIndex;
                  const hasErrors = getStepErrorMessages(step, formState.errors as Record<string, unknown>).length > 0;
                  return (
                    <li key={step}>
                      <button
                        type="button"
                        onClick={() => setActiveStepIndex(index)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-transparent hover:border-border hover:bg-background",
                          hasErrors ? "ring-1 ring-destructive/60" : undefined,
                        )}
                        aria-current={isActive ? "step" : undefined}
                      >
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border">
                          {completed ? (
                            <Check className="h-4 w-4" />
                          ) : isActive ? (
                            <CircleDot className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </span>
                        <span>
                          <span className="text-sm font-medium capitalize">{stepCopy[step].title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {hasErrors ? "Needs attention" : isActive ? stepCopy[step].description : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-auto pt-6 text-xs text-muted-foreground">{renderAutosaveStatus()}</div>
            </aside>
            <main className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">{stepCopy[currentStep].title}</DialogTitle>
                    <DialogDescription>{stepCopy[currentStep].description}</DialogDescription>
                  </DialogHeader>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Step {activeStepIndex + 1} of {STEP_ORDER.length}
                  </span>
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${((activeStepIndex + 1) / STEP_ORDER.length) * 100}%` }} />
                  </div>
                </div>
              </div>
              {stepErrors.length > 0 ? (
                <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                  <p className="font-medium">Please resolve the following before continuing:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {stepErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <form
                className="mt-6 space-y-10"
                onSubmit={(event) => {
                  event.preventDefault();
                }}
              >
                {currentStep === "basics" ? (
                  <section className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Henrys Summer Social"
                        {...register("title")}
                        aria-invalid={formState.errors.title ? "true" : "false"}
                      />
                      {formState.errors.title ? <p className="text-xs text-destructive">{formState.errors.title.message}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        placeholder="A soirée for curious founders."
                        {...register("tagline")}
                        aria-invalid={formState.errors.tagline ? "true" : "false"}
                      />
                      {formState.errors.tagline ? <p className="text-xs text-destructive">{formState.errors.tagline.message}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="category" aria-invalid={formState.errors.category ? "true" : "false"}>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {formState.errors.category ? <p className="text-xs text-destructive">{formState.errors.category.message}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizerName">Organizer name</Label>
                      <Input
                        id="organizerName"
                        placeholder="Henrys Club"
                        {...register("organizerName")}
                        aria-invalid={formState.errors.organizerName ? "true" : "false"}
                      />
                      {formState.errors.organizerName ? (
                        <p className="text-xs text-destructive">{formState.errors.organizerName.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder={EMAIL_CONTACTS.events}
                        {...register("contactEmail")}
                        aria-invalid={formState.errors.contactEmail ? "true" : "false"}
                      />
                      {formState.errors.contactEmail ? (
                        <p className="text-xs text-destructive">{formState.errors.contactEmail.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact phone</Label>
                      <Input id="contactPhone" placeholder="+1 (555) 123-4567" {...register("contactPhone")} />
                      {formState.errors.contactPhone ? (
                        <p className="text-xs text-destructive">{formState.errors.contactPhone.message as string}</p>
                      ) : null}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={6}
                        placeholder="Tell attendees what makes this event special..."
                        {...register("description")}
                        onBlur={(event) => {
                          const sanitized = sanitizeRichText(event.target.value);
                          setValue("description", sanitized, { shouldDirty: true, shouldTouch: true });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">We sanitize rich text to keep everyone safe.</p>
                      {formState.errors.description ? (
                        <p className="text-xs text-destructive">{formState.errors.description.message as string}</p>
                      ) : null}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {values.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                            {tag}
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setValue(
                                  "tags",
                                  values.tags.filter((item) => item !== tag),
                                  { shouldDirty: true, shouldTouch: true, shouldValidate: true },
                                );
                              }}
                              aria-label={`Remove tag ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {values.tags.length < 10 ? (
                          <Input
                            placeholder="Press Enter to add"
                            className="w-48"
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                const value = event.currentTarget.value.trim();
                                if (value && !values.tags.includes(value)) {
                                  setValue("tags", [...values.tags, value], {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                  });
                                  event.currentTarget.value = "";
                                  void trigger("tags");
                                }
                              }
                            }}
                            aria-label="Add tag"
                          />
                        ) : null}
                      </div>
                      {formState.errors.tags ? (
                        <p className="text-xs text-destructive">{formState.errors.tags.message as string}</p>
                      ) : null}
                    </div>
                  </section>
                ) : null}
                {currentStep === "dateTime" ? (
                  <section className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="timeZone">Time zone</Label>
                        <Controller
                          control={control}
                          name="timeZone"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger id="timeZone" aria-invalid={formState.errors.timeZone ? "true" : "false"}>
                                <SelectValue placeholder="Select a time zone" />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {timeZones.map((zone) => (
                                  <SelectItem key={zone} value={zone}>
                                    {zone}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {formState.errors.timeZone ? (
                          <p className="text-xs text-destructive">{formState.errors.timeZone.message as string}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <Controller
                          control={control}
                          name="allDay"
                          render={({ field }) => (
                            <Switch
                              id="allDay"
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked)}
                            />
                          )}
                        />
                        <Label htmlFor="allDay" className="text-sm font-medium">
                          All-day event
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startDateTime">Start</Label>
                        <Input
                          id="startDateTime"
                          type="datetime-local"
                          {...register("startDateTime")}
                          aria-invalid={formState.errors.startDateTime ? "true" : "false"}
                        />
                        {formState.errors.startDateTime ? (
                          <p className="text-xs text-destructive">{formState.errors.startDateTime.message}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDateTime">End</Label>
                        <Input
                          id="endDateTime"
                          type="datetime-local"
                          {...register("endDateTime")}
                          aria-invalid={formState.errors.endDateTime ? "true" : "false"}
                        />
                        {formState.errors.endDateTime ? (
                          <p className="text-xs text-destructive">{formState.errors.endDateTime.message}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Schedule type</Label>
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          { value: "single", label: "Single" },
                          { value: "multi", label: "Multi-day" },
                          { value: "recurring", label: "Recurring" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setValue("dateType", option.value as FormValues["dateType"], { shouldDirty: true })}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-4 text-left text-sm",
                              values.dateType === option.value ? "border-primary bg-primary/10" : "border-border",
                            )}
                          >
                            <span>{option.label}</span>
                            {values.dateType === option.value ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                      {formState.errors.dateType ? (
                        <p className="text-xs text-destructive">{formState.errors.dateType.message}</p>
                      ) : null}
                    </div>
                    {values.dateType === "recurring" ? (
                      <div className="rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">Recurrence</h3>
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="recurrence-frequency">Frequency</Label>
                            <Controller
                              control={control}
                              name="recurrence"
                              render={({ field }) => {
                                const current = field.value ?? {
                                  frequency: "WEEKLY",
                                  interval: 1,
                                  byWeekday: [],
                                  ends: "never",
                                };
                                return (
                                  <Select
                                    value={current.frequency}
                                    onValueChange={(value) => field.onChange({ ...current, frequency: value })}
                                  >
                                    <SelectTrigger id="recurrence-frequency">
                                      <SelectValue placeholder="Frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {RECURRENCE_FREQUENCIES.map((freq) => (
                                        <SelectItem key={freq} value={freq}>
                                          {freq}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="recurrence-interval">Interval</Label>
                            <Controller
                              control={control}
                              name="recurrence"
                              render={({ field }) => {
                                const current = field.value ?? {
                                  frequency: "WEEKLY",
                                  interval: 1,
                                  byWeekday: [],
                                  ends: "never",
                                };
                                return (
                                  <Input
                                    id="recurrence-interval"
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={current.interval ?? 1}
                                    onChange={(event) => field.onChange({ ...current, interval: Number(event.target.value) })}
                                  />
                                );
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label>Weekdays</Label>
                          <Controller
                            control={control}
                            name="recurrence"
                            render={({ field }) => {
                              const current = field.value ?? {
                                frequency: "WEEKLY",
                                interval: 1,
                                byWeekday: [],
                                ends: "never",
                              };
                              const days = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
                              return (
                                <div className="flex flex-wrap gap-2">
                                  {days.map((day) => {
                                    const isActive = current.byWeekday?.includes(day) ?? false;
                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                          const list = new Set(current.byWeekday ?? []);
                                          if (list.has(day)) {
                                            list.delete(day);
                                          } else {
                                            list.add(day);
                                          }
                                          field.onChange({ ...current, byWeekday: Array.from(list) });
                                        }}
                                        className={cn(
                                          "rounded-full border px-3 py-1 text-xs font-medium",
                                          isActive ? "border-primary bg-primary/10" : "border-border",
                                        )}
                                      >
                                        {day}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            }}
                          />
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <Controller
                            control={control}
                            name="recurrence"
                            render={({ field }) => {
                              const current = field.value ?? {
                                frequency: "WEEKLY",
                                interval: 1,
                                byWeekday: [],
                                ends: "never",
                              };
                              return (
                                <Fragment>
                                  <div className="space-y-2">
                                    <Label>Ends</Label>
                                    <div className="flex flex-col gap-2 text-xs">
                                      {["never", "until", "count"].map((mode) => (
                                        <label key={mode} className="inline-flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name="recurrence-ends"
                                            value={mode}
                                            checked={current.ends === mode}
                                            onChange={() => field.onChange({ ...current, ends: mode as "never" | "until" | "count" })}
                                          />
                                          <span className="capitalize">{mode}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="recurrence-until">Until</Label>
                                    <Input
                                      id="recurrence-until"
                                      type="date"
                                      value={current.until ?? ""}
                                      disabled={current.ends !== "until"}
                                      onChange={(event) => field.onChange({ ...current, until: event.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="recurrence-count">Count</Label>
                                    <Input
                                      id="recurrence-count"
                                      type="number"
                                      min={1}
                                      max={365}
                                      value={current.count ?? ""}
                                      disabled={current.ends !== "count"}
                                      onChange={(event) => field.onChange({ ...current, count: Number(event.target.value) })}
                                    />
                                  </div>
                                </Fragment>
                              );
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Agenda</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            agendaFieldArray.append({
                              id: generateId("session"),
                              title: "",
                              start: "",
                              end: "",
                              speakers: "",
                            })
                          }
                        >
                          Add session
                        </Button>
                      </div>
                      {agendaFieldArray.fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Add optional agenda sessions to keep attendees on track.</p>
                      ) : (
                        <div className="space-y-4">
                          {agendaFieldArray.fields.map((field, index) => (
                            <div key={field.id} className="rounded-xl border p-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`agenda-${index}-title`}>Title</Label>
                                  <Input id={`agenda-${index}-title`} {...register(`agenda.${index}.title` as const)} />
                                  {formState.errors.agenda?.[index]?.title ? (
                                    <p className="text-xs text-destructive">
                                      {formState.errors.agenda[index]?.title?.message as string}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`agenda-${index}-speakers`}>Speakers</Label>
                                  <Input id={`agenda-${index}-speakers`} {...register(`agenda.${index}.speakers` as const)} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`agenda-${index}-start`}>Start</Label>
                                  <Input id={`agenda-${index}-start`} type="time" {...register(`agenda.${index}.start` as const)} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`agenda-${index}-end`}>End</Label>
                                  <Input id={`agenda-${index}-end`} type="time" {...register(`agenda.${index}.end` as const)} />
                                </div>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => agendaFieldArray.remove(index)}
                                >
                                  Remove session
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}
                {currentStep === "location" ? (
                  <section className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Event type</Label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: "in-person", label: "In-person" },
                          { value: "online", label: "Online" },
                          { value: "hybrid", label: "Hybrid" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setValue("locationType", option.value as FormValues["locationType"], { shouldDirty: true })}
                            className={cn(
                              "rounded-xl border px-4 py-2 text-sm",
                              values.locationType === option.value ? "border-primary bg-primary/10" : "border-border",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(values.locationType === "in-person" || values.locationType === "hybrid") && (
                      <div className="space-y-4 rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">In-person details</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="venueName">Venue name</Label>
                            <Input id="venueName" placeholder="Soho loft" {...register("venueName")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="venueAddress">Street address</Label>
                            <Input id="venueAddress" placeholder="123 Mercer St" {...register("venueAddress")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="venueCity">City</Label>
                            <Input id="venueCity" {...register("venueCity")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="venueState">State/Region</Label>
                            <Input id="venueState" {...register("venueState")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="venuePostalCode">Postal code</Label>
                            <Input id="venuePostalCode" {...register("venuePostalCode")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="venueCountry">Country</Label>
                            <Input id="venueCountry" {...register("venueCountry")} />
                          </div>
                        </div>
                        <div className="rounded-lg border">
                          {values.venueAddress ? (
                            <iframe
                              title="Map preview"
                              className="h-48 w-full rounded-lg"
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${values.venueAddress} ${values.venueCity ?? ""}`)}&output=embed`}
                              allowFullScreen
                            />
                          ) : (
                            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                              Add an address to preview the map.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {(values.locationType === "online" || values.locationType === "hybrid") && (
                      <div className="space-y-4 rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">Online details</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="onlinePlatform">Platform</Label>
                            <Input id="onlinePlatform" placeholder="Zoom, Google Meet..." {...register("onlinePlatform")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="joinUrl">Join URL</Label>
                            <Input id="joinUrl" placeholder="https://" {...register("joinUrl")} />
                            {formState.errors.joinUrl ? (
                              <p className="text-xs text-destructive">{formState.errors.joinUrl.message as string}</p>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="meetingId">Meeting ID</Label>
                            <Input id="meetingId" {...register("meetingId")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="passcode">Passcode</Label>
                            <Input id="passcode" {...register("passcode")} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Controller
                            control={control}
                            name="showJoinLinkToRegisteredOnly"
                            render={({ field }) => (
                              <Switch
                                id="showJoinLinkToRegisteredOnly"
                                checked={field.value}
                                onCheckedChange={(checked) => field.onChange(checked)}
                              />
                            )}
                          />
                          <Label htmlFor="showJoinLinkToRegisteredOnly" className="text-sm font-medium">
                            Show link only to registered attendees
                          </Label>
                        </div>
                      </div>
                    )}
                  </section>
                ) : null}
                {currentStep === "registration" ? (
                  <section className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Registration mode</Label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: "rsvp", label: "RSVP" },
                          { value: "ticketing", label: "Ticketing" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setValue("registrationMode", option.value as FormValues["registrationMode"], { shouldDirty: true })}
                            className={cn(
                              "rounded-xl border px-4 py-2 text-sm",
                              values.registrationMode === option.value ? "border-primary bg-primary/10" : "border-border",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {values.registrationMode === "ticketing" ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Ticket types</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              ticketFieldArray.append({
                                id: generateId("ticket"),
                                name: "General Admission",
                                price: 0,
                                currency: "USD",
                                quantity: 100,
                                salesStart: "",
                                salesEnd: "",
                                minPerOrder: 1,
                                maxPerOrder: 10,
                                absorbFees: true,
                                earlyBirdTiers: [],
                              })
                            }
                          >
                            Add ticket
                          </Button>
                        </div>
                        {ticketFieldArray.fields.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Create ticket tiers with pricing, inventory, and limits.</p>
                        ) : (
                          <div className="space-y-4">
                            {ticketFieldArray.fields.map((field, index) => (
                              <div key={field.id} className="space-y-4 rounded-xl border p-4">
                                <div className="grid gap-3 md:grid-cols-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-name`}>Name</Label>
                                    <Input id={`ticket-${index}-name`} {...register(`ticketTypes.${index}.name` as const)} />
                                    {formState.errors.ticketTypes?.[index]?.name ? (
                                      <p className="text-xs text-destructive">
                                        {formState.errors.ticketTypes[index]?.name?.message as string}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-price`}>Price</Label>
                                    <Controller
                                      control={control}
                                      name={`ticketTypes.${index}.price` as const}
                                      render={({ field: priceField }) => (
                                        <Input
                                          id={`ticket-${index}-price`}
                                          type="number"
                                          min={0}
                                          step="0.01"
                                          value={priceField.value}
                                          onChange={(event) => priceField.onChange(Number(event.target.value))}
                                        />
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-currency`}>Currency</Label>
                                    <Controller
                                      control={control}
                                      name={`ticketTypes.${index}.currency` as const}
                                      render={({ field: currencyField }) => (
                                        <Input id={`ticket-${index}-currency`} value={currencyField.value} onChange={currencyField.onChange} />
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-quantity`}>Quantity</Label>
                                    <Controller
                                      control={control}
                                      name={`ticketTypes.${index}.quantity` as const}
                                      render={({ field: quantityField }) => (
                                        <Input
                                          id={`ticket-${index}-quantity`}
                                          type="number"
                                          min={0}
                                          value={quantityField.value}
                                          onChange={(event) => quantityField.onChange(Number(event.target.value))}
                                        />
                                      )}
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-salesStart`}>Sales start</Label>
                                    <Input id={`ticket-${index}-salesStart`} type="datetime-local" {...register(`ticketTypes.${index}.salesStart` as const)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-salesEnd`}>Sales end</Label>
                                    <Input id={`ticket-${index}-salesEnd`} type="datetime-local" {...register(`ticketTypes.${index}.salesEnd` as const)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-minPerOrder`}>Min per order</Label>
                                    <Controller
                                      control={control}
                                      name={`ticketTypes.${index}.minPerOrder` as const}
                                      render={({ field: minField }) => (
                                        <Input
                                          id={`ticket-${index}-minPerOrder`}
                                          type="number"
                                          min={1}
                                          value={minField.value}
                                          onChange={(event) => minField.onChange(Number(event.target.value))}
                                        />
                                      )}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`ticket-${index}-maxPerOrder`}>Max per order</Label>
                                    <Controller
                                      control={control}
                                      name={`ticketTypes.${index}.maxPerOrder` as const}
                                      render={({ field: maxField }) => (
                                        <Input
                                          id={`ticket-${index}-maxPerOrder`}
                                          type="number"
                                          min={1}
                                          value={maxField.value}
                                          onChange={(event) => maxField.onChange(Number(event.target.value))}
                                        />
                                      )}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Controller
                                    control={control}
                                    name={`ticketTypes.${index}.absorbFees` as const}
                                    render={({ field: absorbField }) => (
                                      <Checkbox
                                        id={`ticket-${index}-absorbFees`}
                                        checked={absorbField.value}
                                        onCheckedChange={(checked) => absorbField.onChange(Boolean(checked))}
                                      />
                                    )}
                                  />
                                  <Label htmlFor={`ticket-${index}-absorbFees`} className="text-sm">
                                    Absorb fees
                                  </Label>
                                </div>
                                <div className="space-y-2">
                                  <Label>Early-bird tiers</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setValue(
                                        `ticketTypes.${index}.earlyBirdTiers` as const,
                                        [
                                          ...((values.ticketTypes[index]?.earlyBirdTiers as TicketType["earlyBirdTiers"]) ?? []),
                                          { id: generateId("earlyBird"), label: "Early", price: 0, endsAt: "" },
                                        ],
                                        { shouldDirty: true, shouldTouch: true, shouldValidate: true },
                                      )
                                    }
                                  >
                                    Add early-bird
                                  </Button>
                                  <div className="space-y-2">
                                    {values.ticketTypes[index]?.earlyBirdTiers?.map((tier, tierIndex) => (
                                      <div key={tier.id} className="rounded-lg border p-3">
                                        <div className="grid gap-2 md:grid-cols-3">
                                          <Input
                                            placeholder="Label"
                                            value={tier.label}
                                            onChange={(event) => {
                                              const list = [...values.ticketTypes[index].earlyBirdTiers];
                                              list[tierIndex] = { ...list[tierIndex], label: event.target.value };
                                              setValue(`ticketTypes.${index}.earlyBirdTiers` as const, list, {
                                                shouldDirty: true,
                                                shouldTouch: true,
                                                shouldValidate: true,
                                              });
                                            }}
                                          />
                                          <Input
                                            type="number"
                                            placeholder="Price"
                                            value={tier.price}
                                            onChange={(event) => {
                                              const list = [...values.ticketTypes[index].earlyBirdTiers];
                                              list[tierIndex] = { ...list[tierIndex], price: Number(event.target.value) };
                                              setValue(`ticketTypes.${index}.earlyBirdTiers` as const, list, {
                                                shouldDirty: true,
                                                shouldTouch: true,
                                                shouldValidate: true,
                                              });
                                            }}
                                          />
                                          <Input
                                            type="datetime-local"
                                            value={tier.endsAt ?? ""}
                                            onChange={(event) => {
                                              const list = [...values.ticketTypes[index].earlyBirdTiers];
                                              list[tierIndex] = { ...list[tierIndex], endsAt: event.target.value };
                                              setValue(`ticketTypes.${index}.earlyBirdTiers` as const, list, {
                                                shouldDirty: true,
                                                shouldTouch: true,
                                                shouldValidate: true,
                                              });
                                            }}
                                          />
                                        </div>
                                        <div className="mt-2 flex justify-end">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const list = [...values.ticketTypes[index].earlyBirdTiers];
                                              list.splice(tierIndex, 1);
                                              setValue(`ticketTypes.${index}.earlyBirdTiers` as const, list, {
                                                shouldDirty: true,
                                                shouldTouch: true,
                                                shouldValidate: true,
                                              });
                                            }}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => ticketFieldArray.remove(index)}>
                                    Remove ticket
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3 rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">Promo codes</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            promoFieldArray.append({ id: generateId("promo"), code: "WELCOME", discountType: "percent", value: 10 })
                          }
                        >
                          Add promo code
                        </Button>
                        <div className="space-y-2">
                          {promoFieldArray.fields.map((field, index) => (
                            <div key={field.id} className="rounded-lg border p-3">
                              <div className="grid gap-2 md:grid-cols-2">
                                <Input placeholder="CODE" {...register(`promoCodes.${index}.code` as const)} />
                                <div className="flex gap-2">
                                  <Controller
                                    control={control}
                                    name={`promoCodes.${index}.discountType` as const}
                                    render={({ field: typeField }) => (
                                      <Select value={typeField.value} onValueChange={typeField.onChange}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="amount">Amount</SelectItem>
                                          <SelectItem value="percent">Percent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                  <Controller
                                    control={control}
                                    name={`promoCodes.${index}.value` as const}
                                    render={({ field: valueField }) => (
                                      <Input
                                        type="number"
                                        min={0}
                                        value={valueField.value}
                                        onChange={(event) => valueField.onChange(Number(event.target.value))}
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                <span>Max redemptions</span>
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-24"
                                  {...register(`promoCodes.${index}.maxRedemptions` as const)}
                                />
                              </div>
                              <div className="mt-2 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => promoFieldArray.remove(index)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3 rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">Group discounts</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            groupDiscountFieldArray.append({ id: generateId("group"), label: "Team", minimum: 4, discountPercent: 15 })
                          }
                        >
                          Add group discount
                        </Button>
                        <div className="space-y-2">
                          {groupDiscountFieldArray.fields.map((field, index) => (
                            <div key={field.id} className="rounded-lg border p-3">
                              <Input placeholder="Label" {...register(`groupDiscounts.${index}.label` as const)} />
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <Controller
                                  control={control}
                                  name={`groupDiscounts.${index}.minimum` as const}
                                  render={({ field: minField }) => (
                                    <Input
                                      type="number"
                                      min={2}
                                      value={minField.value}
                                      onChange={(event) => minField.onChange(Number(event.target.value))}
                                      placeholder="Minimum attendees"
                                    />
                                  )}
                                />
                                <Controller
                                  control={control}
                                  name={`groupDiscounts.${index}.discountPercent` as const}
                                  render={({ field: percentField }) => (
                                    <Input
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={percentField.value}
                                      onChange={(event) => percentField.onChange(Number(event.target.value))}
                                      placeholder="Discount %"
                                    />
                                  )}
                                />
                              </div>
                              <div className="mt-2 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => groupDiscountFieldArray.remove(index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-3">
                        <Controller
                          control={control}
                          name="waitlistEnabled"
                          render={({ field }) => (
                            <Switch id="waitlistEnabled" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                          )}
                        />
                        <Label htmlFor="waitlistEnabled" className="text-sm font-medium">
                          Enable waitlist
                        </Label>
                      </div>
                      {values.waitlistEnabled ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="waitlistCapacity">Capacity</Label>
                            <Controller
                              control={control}
                              name="waitlistCapacity"
                              render={({ field }) => (
                                <Input
                                  id="waitlistCapacity"
                                  type="number"
                                  min={1}
                                  value={field.value ?? ""}
                                  onChange={(event) => field.onChange(Number(event.target.value))}
                                />
                              )}
                            />
                            {formState.errors.waitlistCapacity ? (
                              <p className="text-xs text-destructive">{formState.errors.waitlistCapacity.message as string}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Controller
                              control={control}
                              name="waitlistAutoPromote"
                              render={({ field }) => (
                                <Checkbox
                                  id="waitlistAutoPromote"
                                  checked={field.value}
                                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                                />
                              )}
                            />
                            <Label htmlFor="waitlistAutoPromote" className="text-sm">
                              Auto-promote from waitlist
                            </Label>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Attendee form</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            attendeeFieldArray.append({
                              id: generateId("question"),
                              label: "New question",
                              type: "text",
                              required: false,
                              options: "",
                            })
                          }
                        >
                          Add question
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {attendeeFieldArray.fields.map((field, index) => (
                          <div key={field.id} className="rounded-lg border p-3">
                            <div className="grid gap-3 md:grid-cols-3">
                              <Input placeholder="Question" {...register(`attendeeQuestions.${index}.label` as const)} />
                              <Controller
                                control={control}
                                name={`attendeeQuestions.${index}.type` as const}
                                render={({ field: typeField }) => (
                                  <Select value={typeField.value} onValueChange={typeField.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Short text</SelectItem>
                                      <SelectItem value="textarea">Long text</SelectItem>
                                      <SelectItem value="select">Dropdown</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              <div className="flex items-center gap-2">
                                <Controller
                                  control={control}
                                  name={`attendeeQuestions.${index}.required` as const}
                                  render={({ field: requiredField }) => (
                                    <Checkbox
                                      id={`attendee-question-required-${index}`}
                                      checked={requiredField.value}
                                      onCheckedChange={(checked) => requiredField.onChange(Boolean(checked))}
                                    />
                                  )}
                                />
                                <Label htmlFor={`attendee-question-required-${index}`} className="text-sm">
                                  Required
                                </Label>
                              </div>
                            </div>
                            {values.attendeeQuestions[index]?.type === "select" ? (
                              <div className="mt-3">
                                <Label htmlFor={`attendee-question-options-${index}`} className="text-xs font-medium">
                                  Dropdown options (comma separated)
                                </Label>
                                <Input
                                  id={`attendee-question-options-${index}`}
                                  placeholder="Option A, Option B"
                                  {...register(`attendeeQuestions.${index}.options` as const)}
                                />
                              </div>
                            ) : null}
                            <div className="mt-3 flex justify-end">
                              <Button type="button" variant="ghost" size="sm" onClick={() => attendeeFieldArray.remove(index)}>
                                Remove question
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border p-4">
                      <Controller
                        control={control}
                        name="consentAccepted"
                        render={({ field }) => (
                          <Checkbox
                            id="consentAccepted"
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          />
                        )}
                      />
                      <Label htmlFor="consentAccepted" className="text-sm">
                        I confirm the terms, refund policy, and privacy notice have been reviewed.
                      </Label>
                      {formState.errors.consentAccepted ? (
                        <p className="text-xs text-destructive">{formState.errors.consentAccepted.message as string}</p>
                      ) : null}
                    </div>
                  </section>
                ) : null}
                {currentStep === "media" ? (
                  <section className="space-y-6">
                    <div className="rounded-xl border p-4">
                      <Label htmlFor="coverImage" className="text-sm font-semibold">
                        Cover image (1200×628 minimum)
                      </Label>
                      <Input
                        id="coverImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (file && !coverFileIsValid(file).valid) {
                            toast({ title: "Upload error", description: coverFileIsValid(file).message });
                            return;
                          }
                          setValue("coverImage", file, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                        }}
                      />
                      {coverValidation.valid ? null : <p className="mt-2 text-xs text-destructive">{coverValidation.message}</p>}
                      {coverFile ? (
                        <div className="mt-4 space-y-3">
                          <div className="grid gap-4 md:grid-cols-2">
                            {(["16:9", "1:1"] as const).map((aspect) => (
                              <div key={aspect} className="rounded-lg border p-3">
                                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{aspect} preview</span>
                                  <button
                                    type="button"
                                    className={cn(
                                      "rounded-full px-2 py-1",
                                      values.coverCrop.aspect === aspect ? "bg-primary/10 text-primary" : "bg-muted",
                                    )}
                                    onClick={() => setValue("coverCrop", { ...values.coverCrop, aspect }, { shouldDirty: true })}
                                  >
                                    Use
                                  </button>
                                </div>
                                <div
                                  className={cn(
                                    "relative overflow-hidden rounded-lg border",
                                    aspect === "1:1" ? "aspect-square" : "aspect-video",
                                  )}
                                >
                                  <img
                                    src={URL.createObjectURL(coverFile)}
                                    alt="Cover preview"
                                    className="h-full w-full object-cover"
                                    style={{
                                      transform: `scale(${values.coverCrop.zoom}) translate(${values.coverCrop.x - 50}%, ${values.coverCrop.y - 50}%)`,
                                      transition: "transform 0.2s ease",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <Label htmlFor="coverZoom" className="text-xs uppercase tracking-wide text-muted-foreground">
                                Zoom
                              </Label>
                              <Controller
                                control={control}
                                name="coverCrop"
                                render={({ field }) => (
                                  <input
                                    id="coverZoom"
                                    type="range"
                                    min={1}
                                    max={2}
                                    step={0.05}
                                    value={field.value.zoom}
                                    onChange={(event) => field.onChange({ ...field.value, zoom: Number(event.target.value) })}
                                  />
                                )}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="coverX" className="text-xs uppercase tracking-wide text-muted-foreground">
                                Horizontal focus
                              </Label>
                              <Controller
                                control={control}
                                name="coverCrop"
                                render={({ field }) => (
                                  <input
                                    id="coverX"
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={field.value.x}
                                    onChange={(event) => field.onChange({ ...field.value, x: Number(event.target.value) })}
                                  />
                                )}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="coverY" className="text-xs uppercase tracking-wide text-muted-foreground">
                                Vertical focus
                              </Label>
                              <Controller
                                control={control}
                                name="coverCrop"
                                render={({ field }) => (
                                  <input
                                    id="coverY"
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={field.value.y}
                                    onChange={(event) => field.onChange({ ...field.value, y: Number(event.target.value) })}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-xl border p-4">
                      <Label htmlFor="gallery" className="text-sm font-semibold">
                        Gallery (max 10)
                      </Label>
                      <Input
                        id="gallery"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []).slice(0, 10);
                          setValue("gallery", files, { shouldDirty: true, shouldTouch: true });
                        }}
                      />
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {Array.from((values.gallery as File[] | undefined) ?? []).map((file) => (
                          <div key={file.name} className="overflow-hidden rounded-lg border">
                            <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="themeColor">Theme color</Label>
                        <Input
                          id="themeColor"
                          type="color"
                          value={values.themeColor ?? "#1d4ed8"}
                          onChange={(event) => setValue("themeColor", event.target.value, { shouldDirty: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizerLogo">Organizer logo</Label>
                        <Input
                          id="organizerLogo"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => setValue("organizerLogo", event.target.files?.[0] ?? null, { shouldDirty: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sponsorLogos">Sponsor logos</Label>
                        <Input
                          id="sponsorLogos"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => setValue("sponsorLogos", Array.from(event.target.files ?? []), { shouldDirty: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attachments">Attachments (PDF)</Label>
                        <Input
                          id="attachments"
                          type="file"
                          multiple
                          accept="application/pdf"
                          onChange={(event) => setValue("attachments", Array.from(event.target.files ?? []), { shouldDirty: true })}
                        />
                      </div>
                    </div>
                  </section>
                ) : null}
                {currentStep === "visibility" ? (
                  <section className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="privacy">Privacy</Label>
                        <Controller
                          control={control}
                          name="privacy"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger id="privacy">
                                <SelectValue placeholder="Select privacy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="unlisted">Unlisted</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          placeholder="create-new-event"
                          value={values.slug}
                          onChange={(event) => {
                            setSlugManuallyEdited(true);
                            setValue("slug", event.target.value, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            });
                          }}
                        />
                        {formState.errors.slug ? (
                          <p className="text-xs text-destructive">{formState.errors.slug.message as string}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta title</Label>
                      <Input id="metaTitle" placeholder="Title that appears in search results" {...register("metaTitle")} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{values.metaTitle.length} / 70</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta description</Label>
                      <Textarea
                        id="metaDescription"
                        rows={3}
                        placeholder="Short summary for search and social"
                        {...register("metaDescription")}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{values.metaDescription.length} / 160</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Open Graph preview</Label>
                      <div className="rounded-xl border p-4">
                        {coverFile ? (
                          <div className="flex gap-3">
                            <img src={URL.createObjectURL(coverFile)} alt="OG" className="h-24 w-24 rounded-lg object-cover" />
                            <div className="space-y-1 text-sm">
                              <p className="font-semibold">{values.metaTitle || values.title || "Untitled event"}</p>
                              <p className="text-muted-foreground">
                                {values.metaDescription || "Set your meta description to see a preview."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Upload a cover to preview social sharing cards.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Controller
                          control={control}
                          name="enableSchema"
                          render={({ field }) => (
                            <Switch id="enableSchema" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                          )}
                        />
                        <Label htmlFor="enableSchema">Include schema.org/Event JSON-LD</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Controller
                          control={control}
                          name="noindex"
                          render={({ field }) => (
                            <Switch id="noindex" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                          )}
                        />
                        <Label htmlFor="noindex">Add noindex</Label>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <h3 className="text-sm font-semibold">Share links with UTM</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input placeholder="Base URL" {...register("shareBaseUrl")} />
                        <Input placeholder="utm_source" {...register("utmSource")} />
                        <Input placeholder="utm_medium" {...register("utmMedium")} />
                        <Input placeholder="utm_campaign" {...register("utmCampaign")} />
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Preview: {values.shareBaseUrl}
                        {values.shareBaseUrl && (
                          <span>
                            {`?utm_source=${values.utmSource || ""}&utm_medium=${values.utmMedium || ""}&utm_campaign=${values.utmCampaign || ""}`}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {DEFAULT_SHARE_CHANNELS.map((channel) => (
                          <span
                            key={channel.channel}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                              values.shareChannels.includes(channel.channel)
                                ? "border-primary bg-primary/10"
                                : "border-border",
                            )}
                          >
                            {channel.label}
                            <Checkbox
                              checked={values.shareChannels.includes(channel.channel)}
                              onCheckedChange={(checked) => {
                                const set = new Set(values.shareChannels);
                                if (checked) {
                                  set.add(channel.channel);
                                } else {
                                  set.delete(channel.channel);
                                }
                                setValue("shareChannels", Array.from(set), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                              }}
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null}
                {currentStep === "advanced" ? (
                  <section className="space-y-6">
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Co-hosts</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            coHostFieldArray.append({ id: generateId("cohost"), email: "", role: "Coordinator" })
                          }
                        >
                          Invite co-host
                        </Button>
                      </div>
                      <div className="mt-3 space-y-3">
                        {coHostFieldArray.fields.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Add collaborators who can help manage the event.</p>
                        ) : null}
                        {coHostFieldArray.fields.map((field, index) => (
                          <div key={field.id} className="rounded-lg border p-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input placeholder="email@example.com" {...register(`coHosts.${index}.email` as const)} />
                              <Controller
                                control={control}
                                name={`coHosts.${index}.role` as const}
                                render={({ field: roleField }) => (
                                  <Select value={roleField.value} onValueChange={roleField.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Coordinator">Coordinator</SelectItem>
                                      <SelectItem value="Editor">Editor</SelectItem>
                                      <SelectItem value="Viewer">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button type="button" variant="ghost" size="sm" onClick={() => coHostFieldArray.remove(index)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl border p-4">
                        <Controller
                          control={control}
                          name="approvalWorkflow"
                          render={({ field }) => (
                            <Switch id="approvalWorkflow" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                          )}
                        />
                        <div>
                          <Label htmlFor="approvalWorkflow" className="text-sm font-semibold">
                            Require approval before publishing
                          </Label>
                          <p className="text-xs text-muted-foreground">Route drafts to approvers before they go live.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border p-4">
                        <Controller
                          control={control}
                          name="generateIcs"
                          render={({ field }) => (
                            <Switch id="generateIcs" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                          )}
                        />
                        <div>
                          <Label htmlFor="generateIcs" className="text-sm font-semibold">
                            Generate ICS downloads
                          </Label>
                          <p className="text-xs text-muted-foreground">Give attendees a calendar file after registration.</p>
                        </div>
                      </div>
                    </div>
                    {values.duplicateWarning ? (
                      <div className="rounded-xl border border-amber-400/70 bg-amber-100/40 p-4 text-sm">
                        <p className="font-semibold">Possible duplicate event</p>
                        <p className="text-muted-foreground">
                          Another event may share this title, date, and venue. Double-check before publishing.
                        </p>
                      </div>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ageRestriction">Age restriction</Label>
                        <Input id="ageRestriction" placeholder="18+" {...register("ageRestriction")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedulePublishAt">Schedule publish</Label>
                        <Input id="schedulePublishAt" type="datetime-local" {...register("schedulePublishAt")} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessibilityNotes">Accessibility notes</Label>
                      <Textarea
                        id="accessibilityNotes"
                        rows={3}
                        placeholder="Share accommodations, elevator access, captions, etc."
                        {...register("accessibilityNotes")}
                      />
                    </div>
                  </section>
                ) : null}
                {currentStep === "review" ? (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant={values.previewMode === "desktop" ? "default" : "outline"}
                        onClick={() => setValue("previewMode", "desktop", { shouldDirty: true })}
                      >
                        <Monitor className="mr-2 h-4 w-4" /> Desktop
                      </Button>
                      <Button
                        type="button"
                        variant={values.previewMode === "mobile" ? "default" : "outline"}
                        onClick={() => setValue("previewMode", "mobile", { shouldDirty: true })}
                      >
                        <Smartphone className="mr-2 h-4 w-4" /> Mobile
                      </Button>
                    </div>
                    <div className="overflow-hidden rounded-2xl border">
                      <div className={cn(values.previewMode === "mobile" ? "max-w-xs" : "w-full", "bg-muted/40 p-4") }>
                        <div className="space-y-3 rounded-xl bg-background p-4 shadow-sm">
                          {coverFile ? (
                            <img src={URL.createObjectURL(coverFile)} alt="Preview" className="h-40 w-full rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-40 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                              Cover preview
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {values.category} • {new Date(values.startDateTime || Date.now()).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                            <h3 className="text-lg font-semibold">{values.title || "Untitled event"}</h3>
                            <p className="text-sm text-muted-foreground">{values.tagline || "Add a tagline to hook your audience."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <h3 className="text-sm font-semibold">Validation summary</h3>
                      {Object.keys(formState.errors).length === 0 ? (
                        <p className="text-sm text-muted-foreground">All required checks pass. You&apos;re ready to publish.</p>
                      ) : (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                          {Object.values(formState.errors).map((error, index) => (
                            <li key={index}>{(error as { message?: string }).message ?? "Resolve errors in earlier steps."}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {actionState?.status === "error" ? (
                      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                        {actionState.message ?? "We couldn't publish the event."}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </form>
              <DialogFooter className="mt-8 flex flex-col gap-4 border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}>
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const nextIndex = Math.min(STEP_ORDER.length - 1, activeStepIndex + 1);
                        const fields = STEP_FIELD_MAP[currentStep] as FieldPath<FormValues>[];
                        const valid = await trigger(fields);
                        if (valid) {
                          setActiveStepIndex(nextIndex);
                        } else {
                          focusFirstError();
                        }
                      }}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleSaveDraft}>
                      Save draft
                    </Button>
                    <Button type="button" variant="outline" onClick={handleSchedulePublish}>
                      Schedule publish
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePublish}
                      disabled={!formState.isValid || isPublishing}
                    >
                      {isPublishing ? "Publishing…" : "Publish now"}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </main>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
