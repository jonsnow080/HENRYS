import { SignJWT } from "jose";

import { Role } from "@/lib/prisma-constants";

type CreateSessionCookieOptions = {
  role: Role;
  secret: string;
  baseURL?: string;
};

export async function createSessionCookie({ role, secret, baseURL = "http://127.0.0.1:3000" }: CreateSessionCookieOptions) {
  const url = new URL(baseURL);
  const jwt = await new SignJWT({
    name: `${role.toLowerCase()} user`,
    email: `${role.toLowerCase()}@example.com`,
    role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(`${role.toLowerCase()}-user-id`)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return {
    name: "next-auth.session-token",
    value: jwt,
    domain: url.hostname,
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}
