import { headers } from "next/headers";

export async function getBaseUrl() {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.SITE_URL) return process.env.SITE_URL;

    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") ?? "http";

    return `${protocol}://${host}`;
}
