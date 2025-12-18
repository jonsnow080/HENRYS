"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { updateMemberProfile } from "@/app/actions/member-profile";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Define the schema for the profile form
const profileFormSchema = z.object({
    about: z.string().optional(),
    linkedinUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    instagramUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    perfectSaturday: z.string().optional(),
    isPublic: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
    initialData: {
        about: string | null;
        linkedinUrl: string | null;
        instagramUrl: string | null;
        perfectSaturday: string | null;
        isPublic: boolean;
    };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            about: initialData.about ?? "",
            linkedinUrl: initialData.linkedinUrl ?? "",
            instagramUrl: initialData.instagramUrl ?? "",
            perfectSaturday: initialData.perfectSaturday ?? "",
            isPublic: initialData.isPublic,
        },
    });

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true);
        try {
            const result = await updateMemberProfile(data);
            if (result.success) {
                toast({
                    title: "Profile updated",
                    description: "Your profile changes have been saved successfully.",
                });
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Something went wrong. Please try again.",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us a little about yourself..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Your bio will be visible to other members if you make your profile public.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>LinkedIn URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="instagramUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instagram URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://instagram.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="perfectSaturday"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>What does your perfect Saturday look like?</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Wake up late, brunch..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Profile</FormLabel>
                        <FormDescription>
                            Allow other members to see your profile details.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <FormField
                            control={form.control}
                            name="isPublic"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </FormControl>
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save changes"}
                </Button>
            </form>
        </Form>
    );
}
