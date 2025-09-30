import type { NextAuthConfig, SignOutEvent } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/prisma-constants";
import { verifyPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email/send";
import { magicLinkTemplate } from "@/lib/email/templates";
import { SITE_COPY } from "@/lib/site-copy";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const allowedMemberRoles = new Set<Role>([Role.MEMBER, Role.HOST, Role.ADMIN]);

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

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        if (!allowedMemberRoles.has(user.role)) {
          throw new Error("ACCESS_DENIED");
        }

        const { passwordHash, ...safeUser } = user;
        void passwordHash;
        return safeUser;
      },
    }),
    EmailProvider({
      maxAge: 15 * 60,
      from: process.env.AUTH_EMAIL_FROM ?? `HENRYS <mail@henrys.club>`,
      normalizeIdentifier(identifier) {
        return identifier.trim().toLowerCase();
      },
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
      async sendVerificationRequest({ identifier, url }) {
        const email = identifier.trim().toLowerCase();
        const rateLimit = checkRateLimit(`magic-link:${email}`);
        if (!rateLimit.allowed) {
          const error = new Error("RATE_LIMIT_EXCEEDED");
          (error as Error & { rateLimit?: typeof rateLimit }).rateLimit = rateLimit;
          throw error;
        }

        await sendEmail({
          to: email,
          subject: `${SITE_COPY.name} — one-click login`,
          mjml: magicLinkTemplate({ url }),
          text: `Sign in to ${SITE_COPY.name} by visiting ${url}`,
          tags: [{ name: "category", value: "magic-link" }],
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as { id: string; role: Role; email?: string | null; name?: string | null };
        token.sub = typedUser.id;
        token.role = typedUser.role;
        if (typedUser.email) {
          token.email = typedUser.email;
        }
        if (typedUser.name) {
          token.name = typedUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }
        const role = token.role;
        if (typeof role === "string" && Object.values(Role).includes(role as Role)) {
          session.user.role = role as Role;
        }
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }
      return session;
    },
    async signIn({ user }) {
      if (!user) return false;
      return allowedMemberRoles.has((user as { role: Role }).role);
    },
  },
  events: {
    async signOut(event) {
      const email = extractEmailFromSignOut(event);
      if (!email) {
        return;
      }

      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
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
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

export default authConfig;
