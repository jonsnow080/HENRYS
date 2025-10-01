import NextAuth from "next-auth";
import authConfig from "./auth.config";

const authResult = NextAuth(authConfig);

export const { auth, signIn, signOut } = authResult;
export const { GET, POST } = authResult.handlers;
