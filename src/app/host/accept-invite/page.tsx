import { prisma } from "@/lib/prisma";

import { HostSignUpForm } from "./host-sign-up-form";

export default async function AcceptInvitePage(props: {
    searchParams: Promise<{ code?: string }>;
}) {
    const searchParams = await props.searchParams;
    const { code } = searchParams;

    if (!code) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <p className="text-red-500">Invalid invite link. Please check your email.</p>
            </div>
        );
    }

    const invite = await prisma.inviteCode.findUnique({
        where: { code },
    });

    if (!invite || invite.redeemedAt) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <p className="text-red-500">This invite code is invalid or has already been used.</p>
            </div>
        );
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <p className="text-red-500">This invite code has expired.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Join as a Host
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Complete your profile to start hosting events.
                    </p>
                </div>
                <HostSignUpForm code={code} />
            </div>
        </div>
    );
}
