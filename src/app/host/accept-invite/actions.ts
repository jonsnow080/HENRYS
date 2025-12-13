"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/prisma-constants";
import { signIn } from "@/auth";
import bcrypt from "bcryptjs";

export async function registerHostAction(formData: FormData) {
    const code = formData.get("code");
    const name = formData.get("name");
    const password = formData.get("password");
    const availability = formData.get("availability");
    const city = formData.get("city");

    if (
        typeof code !== "string" ||
        typeof name !== "string" ||
        typeof password !== "string"
    ) {
        return { error: "Missing required fields" };
    }

    const inviteIndex = await prisma.inviteCode.findUnique({
        where: { code },
    });

    if (!inviteIndex || inviteIndex.redeemedAt) {
        return { error: "Invalid or expired invite code" };
    }

    // Note: We might want to verify the user doesn't exist yet, but the invite flow usually implies new user.
    // If email was associated with invite, we should enforce it? 
    // The current inviteCode model doesn't strictly bind email, but addHostAction didn't bind it either.
    // Ideally, addHostAction SHOULD bind email to inviteCode if we want to be secure, but for now we follow the plan.
    // Actually, wait, addHostAction took an email. But InviteCode model doesn't have email field in the schema updates I saw?
    // Let's check schema again. `InviteCode` has `applicationId`, `userId` (redeemer), `createdById`. No direct email field.
    // So validation relies on the code.

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // We need the email to create the user. 
    // Since the invite code doesn't store the email, we technically need the user to input it OR we should have stored it.
    // The user prompt said: "this should generate a link and a welcome email to them, which takes them to a sign up flow."
    // Typically sign up flows ask for email again or pre-fill it. 
    // I will ask for email in the form to be safe.

    const email = formData.get("email");
    if (typeof email !== "string") {
        return { error: "Email is required" };
    }

    // Check if user exists (shouldn't if they are new, but race conditions etc)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        // If they exist, maybe we just upgrade them? But this flow is for "even if they arent an exisitng user".
        // If they exist, they should probably log in.
        return { error: "User already exists. Please log in." };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Create User
            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    role: Role.HOST,
                    emailVerified: new Date(),
                    hostProfile: {
                        create: {
                            availability: availability as string, // Cast for simplicity, could be null
                            cities: city ? [city as string] : [], // Simplistic handling, user asked for cities
                        }
                    }
                },
            });

            // Mark invite as redeemed
            await tx.inviteCode.update({
                where: { id: inviteIndex.id },
                data: {
                    redeemedAt: new Date(),
                    userId: user.id,
                },
            });
        });
    } catch (err) {
        console.error("Failed to register host", err);
        return { error: "Something went wrong. Please try again." };
    }

    // Sign in
    // We can't strictly sign in inside a server action easily without `next-auth`'s `signIn` which might redirect. 
    // Let's try calling signIn.
    await signIn("credentials", {
        email,
        password,
        redirectTo: "/admin/hosts/dashboard", // Redirect to their dashboard
    });
}
