import type { ComponentProps } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Role, ApplicationStatus } from "@/lib/prisma-constants";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import {
  bulkUpdateApplications,
  buildApplicationEmailPayload,
  updateSingleApplicationStatus,
  type DecisionTemplateOption,
} from "./actions";
import { ApplicationNotesDialog } from "./application-notes-dialog";
import { ApplicationEmailDialog, type ApplicationEmailPreview } from "./application-email-dialog";
import { readApplicationPayload } from "@/lib/application/admin";
import type { ApplicationFormInput } from "@/lib/application/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { renderMjml } from "@/lib/email/mjml";

type SearchParams = Record<string, string | string[] | undefined>;

const STATUS_OPTIONS = Object.values(ApplicationStatus);
const SORT_OPTIONS = ["newest", "oldest", "name", "status"] as const;
const EMAIL_TEMPLATE_OPTIONS: DecisionTemplateOption[] = [
  ApplicationStatus.APPROVED,
  ApplicationStatus.WAITLIST,
  ApplicationStatus.REJECTED,
];

const AGE_BANDS = [
  { value: "under25", label: "Under 25", test: (age?: number) => typeof age === "number" && age < 25 },
  { value: "25-34", label: "25-34", test: (age?: number) => typeof age === "number" && age >= 25 && age <= 34 },
  { value: "35-44", label: "35-44", test: (age?: number) => typeof age === "number" && age >= 35 && age <= 44 },
  { value: "45+", label: "45+", test: (age?: number) => typeof age === "number" && age >= 45 },
  { value: "unknown", label: "Unknown", test: (age?: number) => typeof age !== "number" },
] as const;

type AgeBandValue = (typeof AGE_BANDS)[number]["value"];

type AdminApplication = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewer: string | null;
  notes: string;
  payload: ApplicationFormInput | null;
  ageBand: AgeBandValue;
};

type RawApplication = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewer: { name: string | null; email: string | null } | null;
  notes: string | null;
  payload: unknown;
};

export const metadata: Metadata = {
  title: `Applications · ${SITE_COPY.name}`,
  description: "Review and manage incoming HENRYS applications.",
};

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return null;
  }

  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : "newest";
  const ageBandParam = typeof searchParams.ageBand === "string" ? searchParams.ageBand : undefined;

  const selectedStatus = STATUS_OPTIONS.includes(statusParam as ApplicationStatus)
    ? (statusParam as ApplicationStatus)
    : null;
  const sort = SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
    ? (sortParam as (typeof SORT_OPTIONS)[number])
    : "newest";
  const selectedAgeBand = AGE_BANDS.some((band) => band.value === ageBandParam)
    ? (ageBandParam as AgeBandValue)
    : null;

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
    ];
  }
  if (selectedStatus) {
    where.status = selectedStatus;
  }

  const orderBy = (() => {
    switch (sort) {
      case "oldest":
        return { createdAt: "asc" };
      case "name":
        return [{ fullName: "asc" }, { createdAt: "desc" }];
      case "status":
        return [{ status: "asc" }, { createdAt: "desc" }];
      default:
        return { createdAt: "desc" };
    }
  })();

  const applications = (await prisma.application.findMany({
    where,
    orderBy,
    include: { reviewer: { select: { name: true, email: true } } },
  })) as RawApplication[];

  const statusCountsEntries = await Promise.all(
    STATUS_OPTIONS.map(async (status) => [status, await prisma.application.count({ where: { status } })] as const),
  );
  const statusCounts = Object.fromEntries(statusCountsEntries) as Record<ApplicationStatus, number>;
  const totalApplications = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);

  const adminApplications: AdminApplication[] = applications.map((application) => {
    const payload = readApplicationPayload(application.payload);
    const age = typeof payload?.age === "number" ? payload.age : undefined;
    return {
      id: application.id,
      fullName: application.fullName,
      email: application.email,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      reviewedAt: application.reviewedAt ? application.reviewedAt.toISOString() : null,
      reviewer: application.reviewer ? application.reviewer.name ?? application.reviewer.email : null,
      notes: application.notes ?? "",
      payload,
      ageBand: determineAgeBand(age),
    } satisfies AdminApplication;
  });

  const emailPreviewEntries = await Promise.all(
    adminApplications.map(async (application) => {
      const previews = await Promise.all(
        EMAIL_TEMPLATE_OPTIONS.map(async (template) => {
          const payload = await buildApplicationEmailPayload({
            application: {
              id: application.id,
              email: application.email,
              fullName: application.fullName,
              status: application.status,
              notes: application.notes.length ? application.notes : null,
            },
            template,
            includeMagicLink: false,
          });
          return {
            template,
            subject: payload.subject,
            html: renderMjml(payload.mjml),
          } satisfies ApplicationEmailPreview;
        }),
      );
      return [application.id, previews] as const;
    }),
  );
  const emailPreviewMap = new Map<string, ApplicationEmailPreview[]>(emailPreviewEntries);

  const visibleApplications = selectedAgeBand
    ? adminApplications.filter((application) => application.ageBand === selectedAgeBand)
    : adminApplications;

  const filterParams = new URLSearchParams();
  if (query) filterParams.set("q", query);
  if (selectedStatus) filterParams.set("status", selectedStatus);
  if (selectedAgeBand) filterParams.set("ageBand", selectedAgeBand);
  if (sort !== "newest") filterParams.set("sort", sort);
  const redirectPath = `/admin/applications${filterParams.size ? `?${filterParams.toString()}` : ""}`;

  const successMessage = searchParams.success === "1"
    ? buildSuccessMessage(searchParams, visibleApplications.length)
    : null;
  const errorMessage = typeof searchParams.error === "string"
    ? (typeof searchParams.reason === "string" && searchParams.reason.length
        ? searchParams.reason
        : "Unable to update applications.")
    : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Applications</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Vetting queue</h1>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            {totalApplications} applications total
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {STATUS_OPTIONS.map((status) => (
            <Badge key={status} variant="muted" className="gap-2">
              <span>{statusLabel(status)}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                {statusCounts[status] ?? 0}
              </span>
            </Badge>
          ))}
        </div>
      </header>

      <FilterForm
        defaultQuery={query}
        defaultStatus={selectedStatus}
        defaultSort={sort}
        defaultAgeBand={selectedAgeBand}
      />

      {successMessage || errorMessage ? (
        <div
          className={
            successMessage
              ? "rounded-3xl border border-emerald-300/60 bg-emerald-100/40 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "rounded-3xl border border-destructive/40 bg-destructive/5 px-5 py-4 text-sm text-destructive"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{successMessage ?? errorMessage}</p>
            <Link
              href={redirectPath}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Link>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[36px] border border-border/70 bg-card/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Personality & preferences</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    No applications found. Adjust your filters or check back soon.
                  </TableCell>
                </TableRow>
              ) : (
                visibleApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        name="applicationId"
                        value={application.id}
                        form="bulk-update-form"
                        className="h-4 w-4 rounded border-border accent-foreground"
                        aria-label={`Select ${application.fullName}`}
                      />
                    </TableCell>
                    <TableCell>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{application.fullName}</p>
                            <StatusBadge status={application.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">{application.email}</p>
                          {application.payload ? (
                            <p className="text-xs text-muted-foreground">
                              {application.payload.age ? `${application.payload.age} · ` : null}
                              {application.payload.city}
                              {application.payload.occupation
                                ? ` · ${application.payload.occupation}`
                                : null}
                            </p>
                          ) : null}
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Age band: {AGE_BANDS.find((band) => band.value === application.ageBand)?.label ?? "Unknown"}
                          </p>
                          <details className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-xs text-muted-foreground">
                            <summary className="cursor-pointer list-none text-xs font-semibold text-foreground">
                              Read responses
                            </summary>
                            <div className="mt-2 space-y-3">
                              {application.payload?.motivation ? (
                                <ResponseBlock
                                  label="What brings you to HENRYS?"
                                  value={application.payload.motivation}
                                />
                              ) : null}
                              {application.payload?.threeWords ? (
                                <ResponseBlock
                                  label="Three words friends use"
                                  value={application.payload.threeWords}
                                />
                              ) : null}
                              {application.payload?.perfectSaturday ? (
                                <ResponseBlock
                                  label="Perfect Saturday"
                                  value={application.payload.perfectSaturday}
                                />
                              ) : null}
                              {application.notes ? (
                                <ResponseBlock label="Reviewer notes" value={application.notes} />
                              ) : null}
                            </div>
                          </details>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3 text-xs text-muted-foreground">
                          {application.payload?.dealBreakers?.length ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">Deal-breakers</p>
                              <div className="flex flex-wrap gap-2">
                                {application.payload.dealBreakers.map((item) => (
                                  <Badge key={item} variant="outline" className="bg-background/60 text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {application.payload?.dietary ? (
                            <p>
                              <span className="font-semibold text-foreground">Dietary:</span> {application.payload.dietary}
                            </p>
                          ) : null}
                          {application.payload?.dietaryNotes ? (
                            <p>
                              <span className="font-semibold text-foreground">Notes:</span> {application.payload.dietaryNotes}
                            </p>
                          ) : null}
                          {application.payload?.alcohol ? (
                            <p>
                              <span className="font-semibold text-foreground">Alcohol:</span> {application.payload.alcohol}
                            </p>
                          ) : null}
                          {typeof application.payload?.vibe === "number" ? (
                            <p>
                              <span className="font-semibold text-foreground">Vibe:</span> {application.payload.vibe}/10
                            </p>
                          ) : null}
                          {application.payload?.availability ? (
                            <p>
                              <span className="font-semibold text-foreground">Availability:</span> {application.payload.availability}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p>
                            Submitted {formatDate(application.createdAt)}
                          </p>
                          {application.reviewedAt ? (
                            <p>
                              Reviewed {formatDate(application.reviewedAt)}
                              {application.reviewer ? ` by ${application.reviewer}` : ""}
                            </p>
                          ) : (
                            <p className="text-amber-500">Awaiting review</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ApplicationQuickActions
                          applicationId={application.id}
                          applicantName={application.fullName}
                          currentStatus={application.status}
                          redirectPath={redirectPath}
                          defaultNotes={application.notes}
                          emailPreviews={emailPreviewMap.get(application.id) ?? []}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>

        <form
          id="bulk-update-form"
          action={bulkUpdateApplications}
          className="flex flex-col gap-4 border-t border-border/70 bg-background/60 p-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <input type="hidden" name="redirectTo" value={redirectPath} />
          <div className="flex flex-col gap-2 sm:w-60">
            <label htmlFor="nextStatus" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Set status to
            </label>
            <select
              id="nextStatus"
              name="nextStatus"
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground"
              defaultValue=""
            >
              <option value="" disabled>
                Choose…
              </option>
              {STATUS_OPTIONS.filter((status) => status !== ApplicationStatus.SUBMITTED).map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes (optional)
            </label>
            <Textarea id="notes" name="notes" rows={3} className="mt-2" placeholder="Add context for the team." />
            <p className="mt-1 text-[11px] text-muted-foreground">Notes apply to all selected applications.</p>
          </div>
          <Button type="submit" className="h-11 px-6">
            Update selected
          </Button>
        </form>
      </div>
    </div>
  );
}

function ApplicationQuickActions({
  applicationId,
  applicantName,
  currentStatus,
  redirectPath,
  defaultNotes,
  emailPreviews,
}: {
  applicationId: string;
  applicantName: string;
  currentStatus: ApplicationStatus;
  redirectPath: string;
  defaultNotes: string;
  emailPreviews: ApplicationEmailPreview[];
}) {
  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex w-full justify-end gap-2">
        <QuickActionButton
          label="Review"
          status={ApplicationStatus.IN_REVIEW}
          redirectPath={redirectPath}
          applicationId={applicationId}
          applicantName={applicantName}
          currentStatus={currentStatus}
          variant="secondary"
        />
        <QuickActionButton
          label="Approve"
          status={ApplicationStatus.APPROVED}
          redirectPath={redirectPath}
          applicationId={applicationId}
          applicantName={applicantName}
          currentStatus={currentStatus}
        />
        <QuickActionButton
          label="Deny"
          status={ApplicationStatus.REJECTED}
          redirectPath={redirectPath}
          applicationId={applicationId}
          applicantName={applicantName}
          currentStatus={currentStatus}
          variant="destructive"
        />
      </div>
      <div className="flex w-full justify-end gap-2">
        <ApplicationNotesDialog
          applicationId={applicationId}
          applicantName={applicantName}
          defaultNotes={defaultNotes}
        />
        <ApplicationEmailDialog
          applicationId={applicationId}
          applicantName={applicantName}
          previews={emailPreviews}
        />
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  status,
  redirectPath,
  applicationId,
  applicantName,
  currentStatus,
  variant = "default",
}: {
  label: string;
  status: ApplicationStatus;
  redirectPath: string;
  applicationId: string;
  applicantName: string;
  currentStatus: ApplicationStatus;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const isCurrentStatus = currentStatus === status;
  return (
    <form action={updateSingleApplicationStatus} className="inline">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="nextStatus" value={status} />
      <input type="hidden" name="redirectTo" value={redirectPath} />
      <Button
        type="submit"
        size="sm"
        variant={variant}
        disabled={isCurrentStatus}
        title={
          isCurrentStatus
            ? `${applicantName} is already ${statusLabel(status).toLowerCase()}.`
            : `${label} ${applicantName}`
        }
      >
        {label}
      </Button>
    </form>
  );
}

function buildSuccessMessage(searchParams: SearchParams, fallbackCount: number) {
  const count = Number(searchParams.updated ?? fallbackCount);
  const status = typeof searchParams.statusChange === "string"
    ? (STATUS_OPTIONS.includes(searchParams.statusChange as ApplicationStatus)
        ? (searchParams.statusChange as ApplicationStatus)
        : null)
    : null;
  if (!count || !status) {
    return `Updated ${count || "several"} applications.`;
  }
  return `Updated ${count} application${count === 1 ? "" : "s"} to ${statusLabel(status)}.`;
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: ApplicationStatus) {
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

function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === ApplicationStatus.APPROVED) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
      >
        Approved
      </Badge>
    );
  }
  if (status === ApplicationStatus.IN_REVIEW) {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200"
      >
        In review
      </Badge>
    );
  }
  if (status === ApplicationStatus.WAITLIST) {
    return (
      <Badge
        variant="outline"
        className="border-amber-400/70 bg-amber-100/40 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
      >
        Waitlist
      </Badge>
    );
  }
  if (status === ApplicationStatus.REJECTED) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/60 bg-destructive/10 text-destructive"
      >
        Rejected
      </Badge>
    );
  }
  return <Badge variant="muted">Submitted</Badge>;
}

function determineAgeBand(age?: number): AgeBandValue {
  const match = AGE_BANDS.find((band) => band.test(age));
  return (match?.value ?? "unknown") as AgeBandValue;
}

function FilterForm({
  defaultQuery,
  defaultStatus,
  defaultSort,
  defaultAgeBand,
}: {
  defaultQuery: string;
  defaultStatus: ApplicationStatus | null;
  defaultSort: (typeof SORT_OPTIONS)[number];
  defaultAgeBand: AgeBandValue | null;
}) {
  return (
    <form
      className="grid gap-4 rounded-[28px] border border-border/60 bg-background/80 p-6 sm:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto] sm:items-end"
      method="get"
    >
      <div className="space-y-2">
        <label htmlFor="search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </label>
        <Input
          id="search"
          name="q"
          placeholder="Name, email, or note"
          defaultValue={defaultQuery}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultStatus ?? ""}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="ageBand" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Age band
        </label>
        <select
          id="ageBand"
          name="ageBand"
          defaultValue={defaultAgeBand ?? ""}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">All ages</option>
          {AGE_BANDS.map((band) => (
            <option key={band.value} value={band.value}>
              {band.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={defaultSort}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A→Z</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="h-11 px-6">
          Apply
        </Button>
        <Link href="/admin/applications" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
          Reset
        </Link>
      </div>
    </form>
  );
}

function ResponseBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="leading-snug text-foreground">{value}</p>
    </div>
  );
}
