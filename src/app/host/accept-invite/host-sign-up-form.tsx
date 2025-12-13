"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registerHostAction } from "./actions";

const initialState = {
    error: "",
};

export function HostSignUpForm({ code }: { code: string }) {
    const [state, formAction, pending] = useActionState(async (prevState: unknown, formData: FormData) => {
        const result = await registerHostAction(formData);
        if (result?.error) {
            return { error: result.error };
        }
        return { error: "" };
    }, initialState);

    return (
        <form action={formAction} className="mt-8 space-y-6">
            <input type="hidden" name="code" value={code} />

            <div className="space-y-4 rounded-md shadow-sm">
                <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        className="mt-1"
                        placeholder="Jane Doe"
                    />
                </div>

                <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="mt-1"
                        placeholder="jane@henrys.club"
                    />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="mt-1"
                        minLength={8}
                    />
                </div>

                <div>
                    <Label htmlFor="city">City(ies) you can host in</Label>
                    <Input
                        id="city"
                        name="city"
                        type="text"
                        required
                        className="mt-1"
                        placeholder="New York, Brooklyn"
                    />
                    <p className="mt-1 text-xs text-gray-500">Separate multiple cities with commas.</p>
                </div>

                <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Textarea
                        id="availability"
                        name="availability"
                        required
                        className="mt-1"
                        placeholder="I'm free on Tuesday and Thursday evenings..."
                        rows={3}
                    />
                </div>
            </div>

            {state?.error && (
                <div className="text-sm text-red-600">
                    {state.error}
                </div>
            )}

            <div>
                <Button
                    type="submit"
                    className="w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    disabled={pending}
                >
                    {pending ? "Creating account..." : "Complete Registration"}
                </Button>
            </div>
        </form>
    );
}
