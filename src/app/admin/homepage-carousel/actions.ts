"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?redirectTo=/admin/homepage-carousel");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  return session;
}

export async function createHomepageCarouselImageAction(formData: FormData) {
  await requireAdmin();

  const imageUrl = formData.get("imageUrl");
  const altText = formData.get("altText");

  if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
    return { error: "Image URL is required." };
  }

  const trimmedUrl = imageUrl.trim();
  const trimmedAlt = typeof altText === "string" ? altText.trim() : "";

  const highestSort = await prisma.homepageCarouselImage.findFirst({
    orderBy: { sortOrder: "desc" },
  });

  await prisma.homepageCarouselImage.create({
    data: {
      imageUrl: trimmedUrl,
      altText: trimmedAlt.length > 0 ? trimmedAlt : null,
      sortOrder: (highestSort?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");

  return { success: true };
}

export async function deleteHomepageCarouselImageAction(formData: FormData) {
  await requireAdmin();

  const imageId = formData.get("imageId");
  if (typeof imageId !== "string" || imageId.trim().length === 0) {
    return { error: "Missing image id." };
  }

  try {
    await prisma.homepageCarouselImage.delete({ where: { id: imageId } });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete image." };
  }

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");

  return { success: true };
}
