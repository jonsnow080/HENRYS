import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { wrapRouteHandlerWithSentry } from "@sentry/nextjs";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/prisma-constants";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "./auth.config";

const allowedMemberRoles = new Set<Role>([Role.MEMBER, Role.HOST, Role.ADMIN]);

console.log("DEBUG: Initializing Auth");
console.log("DEBUG: AUTH_RESEND_KEY set:", !!process.env.AUTH_RESEND_KEY);
console.log("DEBUG: AUTH_SECRET set:", !!process.env.AUTH_SECRET);

const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "HENRYS <no-reply@henrys.club>",
    }),
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, email: true, name: true, passwordHash: true, role: true },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const validPassword = await verifyPassword(password, user.passwordHash);
        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } satisfies {
          id: string;
          email: string;
          name: string | null;
          role: Role;
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user?.id) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as {
          id: string;
          role?: Role | null;
          email?: string | null;
          name?: string | null;
        };
        token.sub = typedUser.id;
        if (typedUser.role && Object.values(Role).includes(typedUser.role)) {
          token.role = typedUser.role;
        } else if (typedUser.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: typedUser.id },
            select: { role: true },
          });
          if (dbUser?.role) {
            token.role = dbUser.role;
          }
        }
        if (typedUser.email) {
          token.email = typedUser.email;
        }
        if (typedUser.name) {
          token.name = typedUser.name;
        }
      } else if (token.sub && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (dbUser?.role) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
});

export { auth, signIn, signOut };
export const GET = wrapRouteHandlerWithSentry(handlers.GET, {
  method: "GET",
  parameterizedRoute: "/api/auth/[...nextauth]",
});
export const POST = wrapRouteHandlerWithSentry(handlers.POST, {
  method: "POST",
  parameterizedRoute: "/api/auth/[...nextauth]",
});

