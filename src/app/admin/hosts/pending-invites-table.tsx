
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { resendHostInviteAction } from "./actions";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

type Invite = {
    id: string;
    email: string | null;
    createdAt: Date;
    expiresAt: Date | null;
};

function ResendButton({ inviteId }: { inviteId: string }) {
    const { toast } = useToast();
    const [state, action, pending] = useActionState(resendHostInviteAction, null as any);

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Email resent", description: "Invitation sent successfully." });
        } else if (state?.error) {
            toast({ title: "Error", description: state.error });
        }
    }, [state, toast]);

    return (
        <form action={action}>
            <input type="hidden" name="inviteId" value={inviteId} />
            <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={pending}
                className="text-muted-foreground hover:text-foreground"
            >
                {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Resend
                    </span>
                )}
            </Button>
        </form>
    );
}

export function PendingInvitesTable({ invites }: { invites: Invite[] }) {
    if (invites.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Invitations</h2>
            <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invites.map((invite) => (
                            <TableRow key={invite.id}>
                                <TableCell className="font-medium">{invite.email || "No email"}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {invite.createdAt.toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {invite.expiresAt?.toLocaleDateString() ?? "Never"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ResendButton inviteId={invite.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
}
