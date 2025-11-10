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
    throw new Error("Image URL is required.");
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

}

export async function deleteHomepageCarouselImageAction(formData: FormData) {
  await requireAdmin();

  const imageId = formData.get("imageId");
  if (typeof imageId !== "string" || imageId.trim().length === 0) {
    throw new Error("Missing image id.");
  }

  await prisma.homepageCarouselImage.delete({ where: { id: imageId } });

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");
}

export async function toggleHomepageCarouselImageAction(formData: FormData) {
  await requireAdmin();

  const imageId = formData.get("imageId");
  const mode = formData.get("mode");

  if (typeof imageId !== "string" || imageId.trim().length === 0) {
    throw new Error("Missing image id.");
  }

  if (mode !== "enable" && mode !== "disable") {
    throw new Error("Invalid toggle mode.");
  }

  await prisma.homepageCarouselImage.update({
    where: { id: imageId },
    data: { isEnabled: mode === "enable" },
  });

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");
}

export async function reorderHomepageCarouselImageAction(formData: FormData) {
  await requireAdmin();

  const imageId = formData.get("imageId");
  const direction = formData.get("direction");

  if (typeof imageId !== "string" || imageId.trim().length === 0) {
    throw new Error("Missing image id.");
  }

  if (direction !== "up" && direction !== "down") {
    throw new Error("Invalid reorder direction.");
  }

  const image = await prisma.homepageCarouselImage.findUnique({ where: { id: imageId } });

  if (!image) {
    throw new Error("Carousel image not found.");
  }

  const sortComparison = direction === "up" ? { lt: image.sortOrder } : { gt: image.sortOrder };
  const neighborOrder: "asc" | "desc" = direction === "up" ? "desc" : "asc";

  const neighbor = await prisma.homepageCarouselImage.findFirst({
    where: { sortOrder: sortComparison },
    orderBy: { sortOrder: neighborOrder },
  });

  if (!neighbor) {
    return;
  }

  await prisma.$transaction([
    prisma.homepageCarouselImage.update({
      where: { id: image.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    prisma.homepageCarouselImage.update({
      where: { id: neighbor.id },
      data: { sortOrder: image.sortOrder },
    }),
  ]);

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");
}
