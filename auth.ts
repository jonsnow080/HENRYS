import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/prisma-constants";
import { verifyPassword } from "@/lib/password";

const allowedMemberRoles = new Set<Role>([Role.MEMBER, Role.HOST, Role.ADMIN]);

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
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
    async signIn({ user }) {
      if (!user?.id) {
        return false;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!dbUser) {
        return false;
      }

      return allowedMemberRoles.has(dbUser.role as Role);
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
  },
  events: {
    async signOut(message) {
      let email: string | null = null;

      if ("token" in message) {
        email = message.token?.email ?? null;
      }

      if (!email && "session" in message) {
        const sessionUserId = message.session?.userId;
        if (sessionUserId) {
          const user = await prisma.user.findUnique({
            where: { id: sessionUserId },
            select: { email: true },
          });
          email = user?.email ?? null;
        }
      }

      if (!email) {
        return;
      }

      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

export { auth, signIn, signOut };
export const { GET, POST } = handlers;

export default authConfig;
