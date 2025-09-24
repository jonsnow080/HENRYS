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
  social: 2,
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as FormValues;
        setValues({ ...defaultValues, ...parsed });
      } catch (error) {
        console.warn("Failed to parse draft", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
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
  }, []);

  const fieldErrors = state?.fieldErrors ?? {};

  const submit = (formData: FormData) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form action={submit} className="space-y-8" noValidate>
      <ProgressIndicator currentStep={step} />

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
            <FieldGroup label="Email" error={fieldErrors.email} required>
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
            {fieldErrors.social ? (
              <p className="text-sm text-destructive">{fieldErrors.social.join(" ")}</p>
            ) : null}
            <div className="space-y-4">
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
                value={values.dietary}
                onValueChange={(value) => setField("dietary", value)}
                name="dietary"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No preferences</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="pescetarian">Pescetarian</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="kosher">Kosher</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="dietary" value={values.dietary} />
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
            <Button
              type="button"
              onClick={() => setStep((prev) => Math.min(steps.length, prev + 1))}
            >
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
