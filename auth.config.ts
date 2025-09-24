import type { NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { magicLinkTemplate } from "@/lib/email/templates";
import { SITE_COPY } from "@/lib/site-copy";
import { checkRateLimit } from "@/lib/rate-limit";
import { Role } from "@/lib/prisma-constants";

type SignOutEvent = {
  session?: unknown;
  token?: unknown;
};

function extractEmailFromSignOut(event: SignOutEvent): string | null {
  if (!event || typeof event !== "object") {
    return null;
  }
  const session = (event as { session?: unknown }).session;
  if (!session || typeof session !== "object") {
    return null;
  }
  const user = (session as { user?: unknown }).user;
  if (!user || typeof user !== "object") {
    return null;
  }
  const email = (user as { email?: unknown }).email;
  return typeof email === "string" ? email : null;
}

const allowedMemberRoles = new Set<Role>([
  Role.MEMBER,
  Role.HOST,
  Role.ADMIN,
]);

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    EmailProvider({
      maxAge: 15 * 60,
      server: process.env.EMAIL_SERVER ?? {
        host: process.env.SMTP_HOST ?? "127.0.0.1",
        port: Number(process.env.SMTP_PORT ?? 2525),
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD ?? "",
            }
          : undefined,
      },
      from: process.env.AUTH_EMAIL_FROM ?? "HENRYS Club <no-reply@henrys.club>",
      async sendVerificationRequest({ identifier, url, request }) {
        const email = identifier;
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const key = `${email}:${ip}`;
        const result = checkRateLimit(key);

        if (!result.allowed) {
          throw new Error("TOO_MANY_REQUESTS");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        if (!allowedMemberRoles.has(user.role)) {
          throw new Error("ACCESS_DENIED");
        }

        await sendEmail({
          to: email,
          subject: `${SITE_COPY.name} — magic link inside`,
          mjml: magicLinkTemplate({ url }),
          text: `Sign in to ${SITE_COPY.name} by visiting ${url}`,
          tags: [{ name: "category", value: "magic-link" }],
        });
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.name = user.name ?? session.user.name;
        session.user.email = user.email;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user) return false;
      return allowedMemberRoles.has(user.role);
    },
  },
  cookies: {
    sessionToken: {
      name: "henrys.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    async signOut(event: SignOutEvent) {
      const email = extractEmailFromSignOut(event);
      if (!email) return;
      await prisma.session.deleteMany({ where: { user: { email } } });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

export default authConfig;
