import type { NextAuthConfig } from "next-auth";
import { Role } from "@/lib/prisma-constants";

export const authConfig = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [],
    callbacks: {
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
                }
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
    },
    secret: process.env.AUTH_SECRET,
    trustHost: true,
} satisfies NextAuthConfig;
