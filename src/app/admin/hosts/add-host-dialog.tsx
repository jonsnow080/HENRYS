"use client";

import { useActionState, useEffect, useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addHostAction } from "./actions";

const initialState = {
    error: "",
    success: false,
};

export function AddHostDialog() {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(async (prevState: unknown, formData: FormData) => {
        const result = await addHostAction(formData);
        if (result.error) {
            return { error: result.error, success: false };
        }
        return { error: "", success: true };
    }, initialState);

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
    }, [state.success]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full">Add host</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add a host</DialogTitle>
                    <DialogDescription>
                        Grant host privileges to an existing user. They must already have an account.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="colin@henrys.com"
                            required
                        />
                    </div>
                    {state.error ? (
                        <p className="text-sm text-destructive">{state.error}</p>
                    ) : null}
                    {state.success && (
                        <p className="text-sm text-green-600">Invitation sent successfully!</p>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending ? "Adding…" : "Add host"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
