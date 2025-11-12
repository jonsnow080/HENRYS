"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createHomepageCarouselImageAction(formData: FormData) {
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
      isVisible: true,
      sortOrder: (highestSort?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");

}

export async function deleteHomepageCarouselImageAction(formData: FormData) {
  const imageId = formData.get("imageId");
  if (typeof imageId !== "string" || imageId.trim().length === 0) {
    throw new Error("Missing image id.");
  }

  await prisma.homepageCarouselImage.delete({ where: { id: imageId } });

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");
}

export async function moveHomepageCarouselImageAction(formData: FormData) {
  const imageId = formData.get("imageId");
  const direction = formData.get("direction");

  if (typeof imageId !== "string" || imageId.trim().length === 0) {
    throw new Error("Missing image id.");
  }

  if (direction !== "up" && direction !== "down") {
    throw new Error("Invalid direction.");
  }

  const orderedImages = await prisma.homepageCarouselImage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  let currentIndex = -1;
  for (let index = 0; index < orderedImages.length; index += 1) {
    if (orderedImages[index]?.id === imageId) {
      currentIndex = index;
      break;
    }
  }
  if (currentIndex === -1) {
    throw new Error("Image not found.");
  }

  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (swapIndex < 0 || swapIndex >= orderedImages.length) {
    // Nothing to do if at the bounds.
    return;
  }

  const currentImage = orderedImages[currentIndex];
  const swapImage = orderedImages[swapIndex];

  await prisma.$transaction([
    prisma.homepageCarouselImage.update({
      where: { id: currentImage.id },
      data: { sortOrder: swapImage.sortOrder },
    }),
    prisma.homepageCarouselImage.update({
      where: { id: swapImage.id },
      data: { sortOrder: currentImage.sortOrder },
    }),
  ]);

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");
}

export async function setHomepageCarouselImageVisibilityAction(formData: FormData) {
  const imageId = formData.get("imageId");
  const nextState = formData.get("nextState");

  if (typeof imageId !== "string" || imageId.trim().length === 0) {
    throw new Error("Missing image id.");
  }

  if (nextState !== "show" && nextState !== "hide") {
    throw new Error("Invalid visibility state.");
  }

  await prisma.homepageCarouselImage.update({
    where: { id: imageId },
    data: { isVisible: nextState === "show" },
  });

  revalidatePath("/admin/homepage-carousel");
  revalidatePath("/");
}
