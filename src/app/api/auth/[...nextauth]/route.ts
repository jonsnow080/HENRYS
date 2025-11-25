import { wrapRouteHandlerWithSentry } from "@sentry/nextjs";

import { GET as baseGet, POST as basePost } from "@/auth";

export const GET = wrapRouteHandlerWithSentry(baseGet, "auth-handler");
export const POST = wrapRouteHandlerWithSentry(basePost, "auth-handler");
