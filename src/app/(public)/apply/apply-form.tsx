"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState, useEffect, useId, useState, useTransition } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
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

const defaultValues = {
  fullName: "",
  email: "",
  age: "",
  city: "",
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

type FormValues = typeof defaultValues;

export function ApplyForm() {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [step, setStep] = useState(1);
  const [state, formAction] = useActionState<ApplicationFormState, FormData>(submitApplicationAction, {});
  const [isPending, startTransition] = useTransition();
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [clientErrors, setClientErrors] = useState<Partial<Record<keyof FormValues, string[]>>>({});
  const vibeErrorId = useId();

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

  const setField = React.useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setClientErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const fieldErrors = React.useMemo(() => {
    const serverErrors = state?.fieldErrors ?? {};
    const keys = new Set<keyof FormValues>([
      ...Object.keys(serverErrors),
      ...Object.keys(clientErrors),
    ] as (keyof FormValues)[]);

    return Array.from(keys).reduce<Partial<Record<keyof FormValues, string[]>>>((acc, key) => {
      const combined = [
        ...(clientErrors[key] ?? []),
        ...(serverErrors[key] ?? []),
      ];
      if (combined.length) {
        acc[key] = combined;
      }
      return acc;
    }, {});
  }, [clientErrors, state?.fieldErrors]);

  const vibeInvalid = Boolean(fieldErrors.vibe?.length);

  const validateStep = React.useCallback(
    (currentStep: number, currentValues: FormValues) => {
      const errors: Partial<Record<keyof FormValues, string[]>> = {};

      if (currentStep === 1) {
        if (!currentValues.fullName.trim()) {
          errors.fullName = ["Please enter your full name before continuing."];
        }

        const email = currentValues.email.trim();
        if (!email) {
          errors.email = ["Please add an email address so we can reach you."];
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.email = ["That doesn’t look like a valid email address yet."];
        }

        const ageValue = currentValues.age.trim();
        const age = Number(ageValue);
        if (!ageValue) {
          errors.age = ["Let us know your age to make sure you’re in range."];
        } else if (Number.isNaN(age)) {
          errors.age = ["Please enter your age using numbers only."];
        } else if (age < 25 || age > 38) {
          errors.age = ["Our current cohort is 25-38. Double-check that your age fits."];
        }

        if (!currentValues.city.trim()) {
          errors.city = ["Tell us which city you call home."];
        }

        if (!currentValues.occupation.trim()) {
          errors.occupation = ["Share what you do so we can get to know you."];
        }
      }

      if (currentStep === 2) {
        const vibe = currentValues.vibe;
        if (typeof vibe !== "number" || vibe < 1 || vibe > 10) {
          errors.vibe = ["Choose the vibe you’re bringing on the slider before continuing."];
        }
      }

      if (currentStep === 3) {
        if (currentValues.motivation.trim().length < 40) {
          errors.motivation = ["Share a little more about what brings you to HENRYS before continuing."];
        }

        if (currentValues.threeWords.trim().length < 3) {
          errors.threeWords = ["Add at least three descriptive words so we can get a sense of you."];
        }

        if (currentValues.perfectSaturday.trim().length < 30) {
          errors.perfectSaturday = ["Paint a fuller picture of your perfect Saturday before moving on."];
        }

        if (!currentValues.alcohol.trim()) {
          errors.alcohol = ["Let us know your alcohol preferences before continuing."];
        }

        if (!currentValues.consentCode) {
          errors.consentCode = ["Please confirm you agree to the code of conduct before submitting."];
        }

        if (!currentValues.consentData) {
          errors.consentData = ["Please consent to data storage before submitting."];
        }
      }

      return errors;
    },
    [],
  );

  const clearStepErrors = React.useCallback((currentStep: number) => {
    setClientErrors((prev) => {
      if (!Object.keys(prev).length) {
        return prev;
      }

      const next = { ...prev };
      Object.entries(fieldSteps).forEach(([field, stepNumber]) => {
        if (stepNumber === currentStep) {
          delete next[field as keyof FormValues];
        }
      });
      return next;
    });
  }, []);

  const handleContinue = React.useCallback(() => {
    setStep((currentStep) => {
      const errors = validateStep(currentStep, values);

      if (Object.keys(errors).length) {
        setClientErrors((prev) => ({ ...prev, ...errors }));
        return currentStep;
      }

      clearStepErrors(currentStep);
      return Math.min(steps.length, currentStep + 1);
    });
  }, [clearStepErrors, validateStep, values]);

  const submit = (formData: FormData) => {
    const finalStepErrors = validateStep(3, values);
    if (Object.keys(finalStepErrors).length) {
      setClientErrors((prev) => ({ ...prev, ...finalStepErrors }));
      setStep(3);
      return;
    }

    clearStepErrors(3);

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
      <PersistentFields values={values} />
      <ProgressIndicator currentStep={step} />

      <div className="space-y-3">
        {storageWarning ? (
          <FormMessage
            tone="warning"
            title="Autosave is unavailable"
            description={storageWarning}
          />
        ) : null}
        {state?.message ? (
          <FormMessage
            tone="error"
            title="We couldn’t submit your application"
            description={state.message}
            details={state.fieldErrors?.form}
            action=
              {state.redirectTo ? (
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href={state.redirectTo}>Go to login</Link>
                </Button>
              ) : undefined}
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
            <FieldGroup label="Full name" error={fieldErrors.fullName} required>
              <Input
                name="fullName"
                value={values.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                required
                autoComplete="name"
              />
            </FieldGroup>
            <FieldGroup
              label="Email"
              description="Already have an account? Sign in from the login page."
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
              <FieldGroup label="Age" error={fieldErrors.age} required>
                <Input
                  name="age"
                  type="number"
                  inputMode="numeric"
                  min={25}
                  max={38}
                  value={values.age}
                  onChange={(event) => setField("age", event.target.value)}
                  required
                />
              </FieldGroup>
              <FieldGroup label="City" error={fieldErrors.city} required>
                <Input
                  name="city"
                  value={values.city}
                  onChange={(event) => setField("city", event.target.value)}
                  required
                />
              </FieldGroup>
            </div>
            <FieldGroup label="What do you do?" error={fieldErrors.occupation} required>
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
              <Label className="text-sm font-semibold">What vibe are you bringing?</Label>
              <div
                className={cn(
                  "rounded-3xl border border-border/70 bg-background/80 p-4",
                  vibeInvalid && "border-destructive/50 bg-destructive/10",
                )}
              >
                <Slider
                  name="vibe"
                  min={1}
                  max={10}
                  step={1}
                  value={[values.vibe]}
                  onValueChange={([value]) => setField("vibe", value ?? 5)}
                  aria-invalid={vibeInvalid || undefined}
                  aria-describedby={vibeInvalid ? vibeErrorId : undefined}
                />
                <input type="hidden" name="vibe" value={values.vibe} />
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>Chill</span>
                  <span>Balanced</span>
                  <span>High energy</span>
                </div>
              </div>
              {vibeInvalid ? <ErrorNotice id={vibeErrorId} messages={fieldErrors.vibe ?? []} /> : null}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6">
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
            <FieldGroup label="Three words friends use to describe you" error={fieldErrors.threeWords} required>
              <Input
                name="threeWords"
                value={values.threeWords}
                onChange={(event) => setField("threeWords", event.target.value)}
                placeholder="Warm, curious, mischievous"
                required
              />
            </FieldGroup>
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
            <FieldGroup label="Dietary preferences" error={fieldErrors.dietary}>
              <Select
                value={values.dietary === "" ? "none" : values.dietary}
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
            </FieldGroup>
            <FieldGroup label="Dietary notes">
              <Textarea
                name="dietaryNotes"
                value={values.dietaryNotes}
                onChange={(event) => setField("dietaryNotes", event.target.value)}
                rows={3}
                placeholder="Allergies or chef notes we should know."
              />
            </FieldGroup>
            <FieldGroup label="Alcohol preferences" error={fieldErrors.alcohol} required>
              <Input
                name="alcohol"
                value={values.alcohol}
                onChange={(event) => setField("alcohol", event.target.value)}
                placeholder="Zero-proof only, natural wine nerd, etc."
                required
              />
            </FieldGroup>
            <FieldGroup label="Ideal availability" error={fieldErrors.availability}>
              <Textarea
                name="availability"
                value={values.availability}
                onChange={(event) => setField("availability", event.target.value)}
                rows={3}
                placeholder="Thursday nights, Sunday brunch, etc."
              />
            </FieldGroup>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Deal-breakers</Label>
              <p className="text-sm text-muted-foreground">
                Choose the vibes you&apos;d rather skip. Helps us seat you well.
              </p>
              <div className="flex flex-wrap gap-2">
                {dealBreakerOptions.map((option) => {
                  const active = values.dealBreakers.includes(option);
                  return (
                    <label
                      key={option}
                      className={cn(
                        "cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500",
                      )}
                    >
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
                      <Badge
                        variant={active ? "default" : "outline"}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 text-sm transition",
                          active
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-200"
                            : "border-border text-muted-foreground hover:border-foreground/40",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 transition-opacity",
                            active ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden="true"
                        />
                        <span>{option}</span>
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
                <Checkbox
                  id="consent-code"
                  name="consentCode"
                  checked={values.consentCode}
                  onCheckedChange={(value) => setField("consentCode", Boolean(value))}
                  required
                />
                <Label htmlFor="consent-code" className="text-sm font-normal text-muted-foreground">
                  I agree to uphold the HENRYS code of conduct and support inclusive, respectful spaces.
                </Label>
              </div>
              {fieldErrors.consentCode ? (
                <p className="text-sm text-destructive">{fieldErrors.consentCode.join(" ")}</p>
              ) : null}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent-data"
                  name="consentData"
                  checked={values.consentData}
                  onCheckedChange={(value) => setField("consentData", Boolean(value))}
                  required
                />
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

type ErrorNoticeProps = {
  id?: string;
  messages: string[];
};

function ErrorNotice({ id, messages }: ErrorNoticeProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2 rounded-xl border border-red-500 bg-red-50 p-3 text-sm text-red-700 shadow-[0_1px_0_rgba(220,38,38,0.12)]"
    >
      <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 flex-none" />
      <div className="space-y-1">
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    </div>
  );
}

function PersistentFields({ values }: { values: FormValues }) {
  return (
    <>
      <input type="hidden" name="fullName" value={values.fullName} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="age" value={values.age} />
      <input type="hidden" name="city" value={values.city} />
      <input type="hidden" name="occupation" value={values.occupation} />
      <input type="hidden" name="linkedin" value={values.linkedin} />
      <input type="hidden" name="instagram" value={values.instagram} />
      <input type="hidden" name="motivation" value={values.motivation} />
      <input type="hidden" name="threeWords" value={values.threeWords} />
      <input type="hidden" name="perfectSaturday" value={values.perfectSaturday} />
      <input type="hidden" name="dietary" value={values.dietary} />
      <input type="hidden" name="dietaryNotes" value={values.dietaryNotes} />
      <input type="hidden" name="alcohol" value={values.alcohol} />
      <input type="hidden" name="vibe" value={String(values.vibe)} />
      <input type="hidden" name="availability" value={values.availability} />
      {values.dealBreakers.map((option) => (
        <input key={option} type="hidden" name="dealBreakers" value={option} />
      ))}
      {values.consentCode ? <input type="hidden" name="consentCode" value="on" /> : null}
      {values.consentData ? <input type="hidden" name="consentData" value="on" /> : null}
    </>
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
  const errorId = React.useId();
  const invalid = Boolean(error?.length);

  let control = children;
  if (React.isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    const describedBy = [
      (childProps["aria-describedby"] as string | undefined) ?? undefined,
      invalid ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const cloneProps: Record<string, unknown> = {};

    if (invalid) {
      cloneProps["aria-invalid"] = true;
    }

    if (describedBy) {
      cloneProps["aria-describedby"] = describedBy;
    }

    if ("className" in childProps) {
      cloneProps.className = cn(
        childProps.className as string | undefined,
        invalid && "border-destructive/60 focus-visible:ring-destructive/60",
      );
    }

    control = React.cloneElement(children, cloneProps);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Label className={cn(invalid && "text-destructive")}>{label}</Label>
        {required ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              invalid
                ? "bg-destructive/15 text-destructive"
                : "bg-foreground/10 text-foreground",
            )}
          >
            Required
          </span>
        ) : null}
      </div>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {control}
      {invalid ? <ErrorNotice id={errorId} messages={error ?? []} /> : null}
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
  action?: React.ReactNode;
};

function FormMessage({ tone, title, description, details, action }: FormMessageProps) {
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
    <div className={cn("space-y-3 rounded-2xl border p-4 text-sm", toneClasses.container)}>
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
      {action ? <div>{action}</div> : null}
    </div>
  );
}
