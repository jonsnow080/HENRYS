"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
    about: z.string().optional(),
    linkedinUrl: z.string().optional().or(z.literal("")),
    instagramUrl: z.string().optional().or(z.literal("")),
    perfectSaturday: z.string().optional(),
    isPublic: z.boolean(),
});

export async function updateMemberProfile(data: z.infer<typeof updateProfileSchema>) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const result = updateProfileSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: "Invalid data" };
    }

    try {
        await prisma.memberProfile.update({
            where: { userId: session.user.id },
            data: {
                about: result.data.about,
                linkedinUrl: result.data.linkedinUrl || null,
                instagramUrl: result.data.instagramUrl || null,
                perfectSaturday: result.data.perfectSaturday,
                isPublic: result.data.isPublic,
            },
        });

        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}
