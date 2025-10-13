"use client";

import * as React from "react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { submitApplicationAction, type ApplicationFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { dealBreakerOptions } from "@/lib/application/schema";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "henrys.apply.draft";

const suspiciousPatterns = [
  /<\s*script/iu,
  /\bunion\s+select\b/iu,
  /\bselect\s+.+\s+from\b/iu,
  /\binsert\s+into\b/iu,
  /\bupdate\s+.+\s+set\b/iu,
  /\bdelete\s+from\b/iu,
  /\bdrop\s+table\b/iu,
  /\btruncate\s+table\b/iu,
  /\b(?:or|and)\b\s+['"`]?1['"`]?\s*=\s*['"`]?1/iu,
];

const suspiciousSequencePattern = /['"`][^'"`]{0,80}[;#-]{1,2}\s*$/u;

const defaultValues = {
  fullName: "",
  email: "",
  age: "",
  city: "London",
  occupation: "",
  linkedin: "",
  instagram: "",
  motivation: "",
  threeWords: "",
  perfectSaturday: "",
  dietary: "",
  dietaryNotes: "",
  alcohol: "",
  vibe: 5,
  availability: "",
  dealBreakers: [] as string[],
  consentCode: false,
  consentData: false,
};

type FormValues = typeof defaultValues;
type FieldErrors = Partial<Record<keyof FormValues, string[]>>;

// Map of step -> fields that must be valid before advancing past the step the user just completed.
const stepRequiredFields: Record<number, (keyof FormValues)[]> = {
  1: ["fullName", "email", "age", "city", "occupation"],
  2: [],
  3: ["motivation", "threeWords", "perfectSaturday", "alcohol", "consentCode", "consentData"],
};

// Track the step each field belongs to so we can scope validation messaging appropriately.
const fieldSteps: Record<string, number> = {
  fullName: 1,
  email: 1,
  age: 1,
  city: 1,
  occupation: 1,
  linkedin: 2,
  instagram: 2,
  vibe: 2,
  motivation: 3,
  threeWords: 3,
  perfectSaturday: 3,
  dietary: 3,
  dietaryNotes: 3,
  alcohol: 3,
  availability: 3,
  dealBreakers: 3,
  consentCode: 3,
  consentData: 3,
};

const steps = [
  {
    id: 1,
    title: "Foundations",
    description: "Let’s cover the basics so we can get in touch.",
  },
  {
    id: 2,
    title: "Socials & vibe",
    description: "Share how you show up online and in the room.",
  },
  {
    id: 3,
    title: "Taste & texture",
    description: "Tell us what lights you up and what you avoid.",
  },
];

export function ApplyForm() {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [step, setStep] = useState(1);
  const [state, formAction] = useActionState<ApplicationFormState, FormData>(submitApplicationAction, {});
  const [isPending, startTransition] = useTransition();
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    setClientErrors((prev) => {
      const next: FieldErrors = {};
      for (const [key, messages] of Object.entries(prev)) {
        const fieldStep = fieldSteps[key] ?? Infinity;
        if (messages && fieldStep <= step) {
          next[key as keyof FormValues] = messages;
        }
      }
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const unchanged =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key as keyof FormValues] === next[key as keyof FormValues]);
      return unchanged ? prev : next;
    });
  }, [step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as FormValues;
          setValues({ ...defaultValues, ...parsed });
        } catch (error) {
          console.warn("Failed to parse draft", error);
          setStorageWarning(
            "We found a saved draft but couldn’t load it. Autosave has been reset on this device.",
          );
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch (removeError) {
            console.warn("Unable to clear invalid draft", removeError);
          }
        }
      }
    } catch (error) {
      console.warn("Unable to restore saved application", error);
      setStorageWarning("Autosave isn’t available in this browser. You can still submit your application.");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch (error) {
      console.warn("Unable to persist application draft", error);
      setStorageWarning("We couldn’t save your progress to this device. Submitting still works as normal.");
    }
  }, [values]);

  useEffect(() => {
    if (state?.fieldErrors) {
      const firstField = Object.keys(state.fieldErrors)[0];
      if (firstField && fieldSteps[firstField]) {
        setStep(fieldSteps[firstField]);
      }
    }
  }, [state?.fieldErrors]);

  const setField = React.useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setClientErrors((prev) => {
        if (!prev[key]) {
          return prev;
        }
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSecurityError(null);
    },
    [setClientErrors, setSecurityError, setValues],
  );

  const combinedErrors = React.useMemo<FieldErrors>(() => {
    const errors: FieldErrors = { ...clientErrors };
    if (state?.fieldErrors) {
      for (const [key, messages] of Object.entries(state.fieldErrors)) {
        if (key in defaultValues) {
          errors[key as keyof FormValues] = messages;
        }
      }
    }
    return errors;
  }, [clientErrors, state?.fieldErrors]);

  const fieldErrors = React.useMemo<FieldErrors>(() => {
    const errors: FieldErrors = {};
    for (const [key, messages] of Object.entries(combinedErrors)) {
      const fieldStep = fieldSteps[key] ?? Infinity;
      if (fieldStep <= step) {
        errors[key as keyof FormValues] = messages;
      }
    }
    return errors;
  }, [combinedErrors, step]);

  const getValidationMessage = React.useCallback(
    (field: keyof FormValues): string | null => {
      const value = values[field];
      switch (field) {
        case "fullName": {
          const text = String(value ?? "").trim();
          if (text.length < 3) {
            return "Name must be at least 3 characters";
          }
          if (!/\s/.test(text)) {
            return "Enter your first and last name";
          }
          return null;
        }
        case "email": {
          const text = String(value ?? "").trim();
          if (!text) {
            return "An email is required";
          }
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(text)) {
            return "Enter a valid email";
          }
          if (!text.toLowerCase().endsWith("@gmail.com")) {
            return "Use a personal Gmail address";
          }
          return null;
        }
        case "age": {
          const text = String(value ?? "").trim();
          if (!text) {
            return "Age is required";
          }
          const number = Number(text);
          if (!Number.isInteger(number)) {
            return "Age must be a whole number";
          }
          if (number < 18) {
            return "You must be at least 18";
          }
          if (number > 999) {
            return "Age must be 3 digits or less";
          }
          return null;
        }
        case "city": {
          const text = String(value ?? "").trim();
          if (!text) {
            return "City is required";
          }
          return null;
        }
        case "occupation": {
          const text = String(value ?? "").trim();
          if (!text) {
            return "Tell us what you do";
          }
          const words = text.split(/\s+/).filter(Boolean);
          if (words.length > 3) {
            return "Keep it to 3 words or fewer";
          }
          return null;
        }
        case "motivation": {
          const text = String(value ?? "").trim();
          if (text.length < 40) {
            return "Give us at least a couple of sentences";
          }
          return null;
        }
        case "threeWords": {
          const text = String(value ?? "").trim();
          if (text.length < 3) {
            return "Add at least three words";
          }
          return null;
        }
        case "perfectSaturday": {
          const text = String(value ?? "").trim();
          if (text.length < 30) {
            return "We love details — give us at least 30 characters";
          }
          return null;
        }
        case "alcohol": {
          const text = String(value ?? "").trim();
          if (text.length < 2) {
            return "Let us know your preferences";
          }
          return null;
        }
        case "consentCode": {
          if (!value) {
            return "You must accept the code of conduct";
          }
          return null;
        }
        case "consentData": {
          if (!value) {
            return "You must consent to data use";
          }
          return null;
        }
        default:
          return null;
      }
    },
    [values],
  );

  const validateStep = React.useCallback(
    (currentStep: number) => {
      const requiredFields = stepRequiredFields[currentStep] ?? [];
      if (!requiredFields.length) {
        return true;
      }

      const nextErrors: FieldErrors = {};
      for (const field of requiredFields) {
        const message = getValidationMessage(field);
        if (message) {
          nextErrors[field] = [message];
        }
      }

      setClientErrors((prev) => {
        const updated = { ...prev };
        for (const field of requiredFields) {
          delete updated[field];
        }
        if (Object.keys(nextErrors).length === 0) {
          return updated;
        }
        return { ...updated, ...nextErrors };
      });

      return Object.keys(nextErrors).length === 0;
    },
    [getValidationMessage, setClientErrors],
  );

  const runSecurityCheck = React.useCallback(() => {
    const nextErrors: FieldErrors = {};
    let firstFlaggedField: keyof FormValues | null = null;

    const getSecurityIssue = (value: unknown): string | null => {
      if (typeof value !== "string") {
        return null;
      }
      const normalized = value.trim();
      if (!normalized) {
        return null;
      }
      if (suspiciousPatterns.some((pattern) => pattern.test(normalized))) {
        return "Please remove any code or database commands from this answer.";
      }
      if (suspiciousSequencePattern.test(normalized)) {
        return "This answer includes characters that look unsafe. Try rephrasing it.";
      }
      return null;
    };

    (Object.keys(values) as (keyof FormValues)[]).forEach((key) => {
      const value = values[key];
      if (Array.isArray(value)) {
        for (const entry of value) {
          const issue = getSecurityIssue(entry);
          if (issue) {
            nextErrors[key] = [issue];
            if (!firstFlaggedField) {
              firstFlaggedField = key;
            }
            break;
          }
        }
        return;
      }

      const issue = getSecurityIssue(value);
      if (issue) {
        nextErrors[key] = [issue];
        if (!firstFlaggedField) {
          firstFlaggedField = key;
        }
      }
    });

    if (Object.keys(nextErrors).length) {
      setClientErrors((prev) => ({ ...prev, ...nextErrors }));
      setSecurityError(
        "Some of your answers include characters that look like code or database commands. Please update them before submitting.",
      );
      if (firstFlaggedField && fieldSteps[firstFlaggedField]) {
        setStep(fieldSteps[firstFlaggedField]);
      }
      return false;
    }

    setSecurityError(null);
    return true;
  }, [setClientErrors, setSecurityError, setStep, values]);

  const handleContinue = React.useCallback(() => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(steps.length, prev + 1));
    }
  }, [step, validateStep]);

  const submit = (formData: FormData) => {
    if (!validateStep(step)) {
      return;
    }
    if (!runSecurityCheck()) {
      return;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("Unable to clear saved application", error);
        setStorageWarning(
          "We couldn’t clear the saved draft on this device. If you see old answers later, please clear your browser data.",
        );
      }
    }
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form action={submit} className="space-y-8" noValidate>
      <ProgressIndicator currentStep={step} />

      <div className="space-y-3">
        {storageWarning ? (
          <FormMessage
            tone="warning"
            title="Autosave is unavailable"
            description={storageWarning}
          />
        ) : null}
        {securityError ? (
          <FormMessage
            tone="error"
            title="Check your answers"
            description={securityError}
          />
        ) : null}
        {state?.message ? (
          <FormMessage
            tone="error"
            title="We couldn’t submit your application"
            description={state.message}
            details={state.fieldErrors?.form}
          />
        ) : null}
      </div>

      <section aria-labelledby="apply-step-heading" className="space-y-6">
        <header className="space-y-1">
          <h2 id="apply-step-heading" className="text-2xl font-semibold">
            {steps[step - 1]?.title}
          </h2>
          <p className="text-sm text-muted-foreground">{steps[step - 1]?.description}</p>
        </header>

        {step === 1 && (
          <div className="grid gap-6">
            {/* Step 1 – Foundations: Full name */}
            <FieldGroup label="Full name" error={fieldErrors.fullName} required>
              <Input
                name="fullName"
                value={values.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                required
                autoComplete="name"
              />
            </FieldGroup>
            {/* Step 1 – Foundations: Email */}
            <FieldGroup
              label="Email"
              description="Use a personal Gmail address. We only accept Gmail right now."
              error={fieldErrors.email}
              required
            >
              <Input
                name="email"
                type="email"
                value={values.email}
                onChange={(event) => setField("email", event.target.value)}
                required
                autoComplete="email"
              />
            </FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Step 1 – Foundations: Age */}
              <FieldGroup label="Age" error={fieldErrors.age} required>
                <Input
                  name="age"
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={999}
                  value={values.age}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
                    setField("age", digitsOnly.slice(0, 3));
                  }}
                  required
                />
              </FieldGroup>
              {/* Step 1 – Foundations: City */}
              <FieldGroup label="City" error={fieldErrors.city} required>
                <Input
                  name="city"
                  value={values.city}
                  onChange={(event) => setField("city", event.target.value)}
                  required
                />
              </FieldGroup>
            </div>
            {/* Step 1 – Foundations: Occupation */}
            <FieldGroup
              label="What do you do?"
              description="Keep it short — three words max."
              error={fieldErrors.occupation}
              required
            >
              <Input
                name="occupation"
                value={values.occupation}
                onChange={(event) => setField("occupation", event.target.value)}
                placeholder="Founder, creative director, architect…"
                required
              />
            </FieldGroup>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6">
            {/* Step 2 – Socials & vibe: LinkedIn */}
            <FieldGroup
              label="LinkedIn"
              description="Optional but recommended so we can confirm your details."
              error={fieldErrors.linkedin}
            >
              <Input
                name="linkedin"
                type="url"
                value={values.linkedin}
                onChange={(event) => setField("linkedin", event.target.value)}
                placeholder="https://"
              />
            </FieldGroup>
            {/* Step 2 – Socials & vibe: Instagram */}
            <FieldGroup label="Instagram" error={fieldErrors.instagram}>
              <Input
                name="instagram"
                type="url"
                value={values.instagram}
                onChange={(event) => setField("instagram", event.target.value)}
                placeholder="https://instagram.com/"
              />
            </FieldGroup>
            <div className="space-y-4">
              {/* Step 2 – Socials & vibe: Energy slider */}
              <Label className="text-sm font-semibold">What vibe are you bringing?</Label>
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <Slider
                  name="vibe"
                  min={1}
                  max={10}
                  step={1}
                  value={[values.vibe]}
                  onValueChange={([value]) => setField("vibe", value ?? 5)}
                />
                <input type="hidden" name="vibe" value={values.vibe} />
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>Chill</span>
                  <span>Balanced</span>
                  <span>High energy</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6">
            {/* Step 3 – Taste & texture: Motivation */}
            <FieldGroup label="What brings you to HENRYS?" error={fieldErrors.motivation} required>
              <Textarea
                name="motivation"
                value={values.motivation}
                onChange={(event) => setField("motivation", event.target.value)}
                minLength={40}
                rows={4}
                required
              />
            </FieldGroup>
            {/* Step 3 – Taste & texture: Three words */}
            <FieldGroup label="Three words friends use to describe you" error={fieldErrors.threeWords} required>
              <Input
                name="threeWords"
                value={values.threeWords}
                onChange={(event) => setField("threeWords", event.target.value)}
                placeholder="Warm, curious, mischievous"
                required
              />
            </FieldGroup>
            {/* Step 3 – Taste & texture: Perfect Saturday */}
            <FieldGroup label="Perfect Saturday?" error={fieldErrors.perfectSaturday} required>
              <Textarea
                name="perfectSaturday"
                value={values.perfectSaturday}
                onChange={(event) => setField("perfectSaturday", event.target.value)}
                minLength={30}
                rows={4}
                required
              />
            </FieldGroup>
            {/* Step 3 – Taste & texture: Dietary preferences */}
            <FieldGroup label="Dietary preferences" error={fieldErrors.dietary}>
              <Select
                value={values.dietary ? values.dietary : "none"}
                onValueChange={(value) =>
                  setField("dietary", value === "none" ? "" : value)
                }
                name="dietary"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No preferences</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="pescetarian">Pescetarian</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="kosher">Kosher</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="dietary" value={values.dietary} />
            </FieldGroup>
            {/* Step 3 – Taste & texture: Dietary notes */}
            <FieldGroup label="Dietary notes">
              <Textarea
                name="dietaryNotes"
                value={values.dietaryNotes}
                onChange={(event) => setField("dietaryNotes", event.target.value)}
                rows={3}
                placeholder="Allergies or chef notes we should know."
              />
            </FieldGroup>
            {/* Step 3 – Taste & texture: Alcohol preferences */}
            <FieldGroup label="Alcohol preferences" error={fieldErrors.alcohol} required>
              <Input
                name="alcohol"
                value={values.alcohol}
                onChange={(event) => setField("alcohol", event.target.value)}
                placeholder="Zero-proof only, natural wine nerd, etc."
                required
              />
            </FieldGroup>
            {/* Step 3 – Taste & texture: Availability */}
            <FieldGroup label="Ideal availability" error={fieldErrors.availability}>
              <Textarea
                name="availability"
                value={values.availability}
                onChange={(event) => setField("availability", event.target.value)}
                rows={3}
                placeholder="Thursday nights, Sunday brunch, etc."
              />
            </FieldGroup>
            {/* Step 3 – Taste & texture: Deal-breakers */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Deal-breakers</Label>
              <p className="text-sm text-muted-foreground">
                Choose the vibes you&apos;d rather skip. Helps us seat you well.
              </p>
              <div className="flex flex-wrap gap-2">
                {dealBreakerOptions.map((option) => {
                  const active = values.dealBreakers.includes(option);
                  return (
                    <label key={option} className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        name="dealBreakers"
                        value={option}
                        checked={active}
                        onChange={(event) => {
                          setValues((prev) => {
                            const next = new Set(prev.dealBreakers);
                            if (event.target.checked) {
                              next.add(option);
                            } else {
                              next.delete(option);
                            }
                            return { ...prev, dealBreakers: Array.from(next) };
                          });
                        }}
                      />
                      <Badge variant={active ? "accent" : "outline"} className="px-4 py-2 text-sm">
                        {option}
                      </Badge>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.dealBreakers ? (
                <p className="text-sm text-destructive">{fieldErrors.dealBreakers.join(" ")}</p>
              ) : null}
            </div>
            <fieldset className="space-y-3 rounded-3xl border border-border/70 bg-background/80 p-4">
              <legend className="text-sm font-semibold">Consent</legend>
              <div className="flex items-start gap-3">
                {/* Step 3 – Taste & texture: Code of conduct consent */}
                <Checkbox
                  id="consent-code"
                  name="consentCode"
                  checked={values.consentCode}
                  onCheckedChange={(value) => setField("consentCode", Boolean(value))}
                  required
                />
                <input type="hidden" name="consentCode" value={values.consentCode ? "on" : ""} />
                <Label htmlFor="consent-code" className="text-sm font-normal text-muted-foreground">
                  I agree to uphold the HENRYS code of conduct and support inclusive, respectful spaces.
                </Label>
              </div>
              {fieldErrors.consentCode ? (
                <p className="text-sm text-destructive">{fieldErrors.consentCode.join(" ")}</p>
              ) : null}
              <div className="flex items-start gap-3">
                {/* Step 3 – Taste & texture: Data consent */}
                <Checkbox
                  id="consent-data"
                  name="consentData"
                  checked={values.consentData}
                  onCheckedChange={(value) => setField("consentData", Boolean(value))}
                  required
                />
                <input type="hidden" name="consentData" value={values.consentData ? "on" : ""} />
                <Label htmlFor="consent-data" className="text-sm font-normal text-muted-foreground">
                  I consent to HENRYS storing my data securely to facilitate event matchmaking.
                </Label>
              </div>
              {fieldErrors.consentData ? (
                <p className="text-sm text-destructive">{fieldErrors.consentData.join(" ")}</p>
              ) : null}
            </fieldset>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Step {step} of {steps.length}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {step > 1 && (
            <Button type="button" variant="ghost" onClick={() => setStep((prev) => Math.max(1, prev - 1))}>
              Back
            </Button>
          )}
          {step < steps.length ? (
            <Button type="button" onClick={handleContinue}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={isPending} className="min-w-[160px]">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                </span>
              ) : (
                "Submit application"
              )}
            </Button>
          )}
        </div>
      </div>
      <noscript>
        <p className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
          Heads up: you&apos;re viewing the simplified application. Javascript unlocks autosave and progressive steps, but everything
          still works just fine here.
        </p>
      </noscript>
    </form>
  );
}

type FieldGroupProps = {
  label: string;
  children: React.ReactNode;
  error?: string[];
  description?: string;
  required?: boolean;
};

function FieldGroup({ label, children, error, description, required }: FieldGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Label>{label}</Label>
        {required ? <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs">Required</span> : null}
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {children}
      {error?.length ? (
        <p className="text-sm text-destructive">{error.join(" ")}</p>
      ) : null}
    </div>
  );
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((item) => {
        const active = currentStep === item.id;
        const completed = currentStep > item.id;
        return (
          <React.Fragment key={item.id}>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition",
                active && "border-foreground bg-foreground text-background",
                completed && "border-foreground/60 bg-foreground/10 text-foreground",
                !active && !completed && "border-border/70 text-muted-foreground",
              )}
            >
              {item.id}
            </div>
            {item.id !== steps.length ? (
              <div className="h-[2px] w-16 rounded-full bg-border/70" aria-hidden />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type FormMessageProps = {
  tone: "warning" | "error";
  title: string;
  description: string;
  details?: string[];
};

function FormMessage({ tone, title, description, details }: FormMessageProps) {
  const toneClasses =
    tone === "warning"
      ? {
          container:
            "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100",
          title: "text-amber-900 dark:text-amber-50",
        }
      : {
          container:
            "border-destructive/40 bg-destructive/10 text-destructive dark:border-destructive/60 dark:bg-destructive/20 dark:text-destructive-foreground",
          title: "text-destructive dark:text-destructive-foreground",
        };

  return (
    <div className={cn("rounded-2xl border p-4 text-sm", toneClasses.container)}>
      <div className="space-y-2">
        <p className={cn("font-semibold", toneClasses.title)}>{title}</p>
        <p>{description}</p>
        {details?.length ? (
          <ul className="list-disc space-y-1 pl-5">
            {details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
