import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const memberProfile = await prisma.memberProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!memberProfile) {
        // Ideally this shouldn't happen for approved members, but we can handle it gracefully
        return <div>Profile not found. Please contact support.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your public profile and how others see you on the platform.
                </p>
            </div>
            <Separator />
            <ProfileForm
                initialData={{
                    about: memberProfile.about,
                    linkedinUrl: memberProfile.linkedinUrl,
                    instagramUrl: memberProfile.instagramUrl,
                    perfectSaturday: memberProfile.perfectSaturday,
                    isPublic: memberProfile.isPublic,
                }}
            />
        </div>
    );
}
