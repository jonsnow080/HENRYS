import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@/lib/prisma-constants";
import { prisma } from "@/lib/prisma";
import { SITE_COPY } from "@/lib/site-copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createHomepageCarouselImageAction,
  deleteHomepageCarouselImageAction,
  reorderHomepageCarouselImageAction,
  toggleHomepageCarouselImageAction,
} from "./actions";

type HomepageCarouselImage = Awaited<
  ReturnType<typeof prisma.homepageCarouselImage.findMany>
>[number];

export const metadata: Metadata = {
  title: `Homepage carousel · ${SITE_COPY.name}`,
  description: "Add and curate the photos that appear on the public homepage carousel.",
};

export default async function AdminHomepageCarouselPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?redirectTo=/admin/homepage-carousel");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const images = await prisma.homepageCarouselImage.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Homepage</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Homepage carousel</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Upload new hero photos to keep the public site feeling fresh. Images appear in the order they are listed.
        </p>
      </header>

      <section className="rounded-[32px] border border-border/70 bg-card/70 p-6">
        <form action={createHomepageCarouselImageAction} className="grid gap-4 sm:grid-cols-[2fr,2fr,auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://images.unsplash.com/..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altText">Alt text</Label>
            <Input
              id="altText"
              name="altText"
              type="text"
              placeholder="Describe the scene for screen readers"
            />
          </div>
          <Button type="submit" className="mt-2 w-full sm:mt-0 sm:w-auto">
            Add photo
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Current carousel</h2>
        {images.length === 0 ? (
          <p className="rounded-[28px] border border-dashed border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
            No carousel images yet. Add a photo above to populate the homepage marquee.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((image: HomepageCarouselImage, index: number) => {
              const isFirst = index === 0;
              const isLast = index === images.length - 1;

              return (
                <Card key={image.id} className="border-border/70 bg-card/80">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        Order {image.sortOrder}
                      </span>
                      <CardTitle className="mt-1 text-base">{image.altText ?? "No alt text"}</CardTitle>
                    </div>
                    <Badge variant={image.isEnabled ? "secondary" : "outline"} className="w-fit uppercase tracking-[0.25em]">
                      {image.isEnabled ? "Active" : "Disabled"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/70">
                      <Image
                        src={image.imageUrl}
                        alt={image.altText ?? "Homepage carousel image"}
                        width={640}
                        height={480}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                    <p className="break-all text-xs text-muted-foreground">{image.imageUrl}</p>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    <form action={reorderHomepageCarouselImageAction}>
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button type="submit" variant="outline" size="sm" disabled={isFirst} className="rounded-full px-4">
                        Move up
                      </Button>
                    </form>
                    <form action={reorderHomepageCarouselImageAction}>
                      <input type="hidden" name="imageId" value={image.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button type="submit" variant="outline" size="sm" disabled={isLast} className="rounded-full px-4">
                        Move down
                      </Button>
                    </form>
                    <form action={toggleHomepageCarouselImageAction}>
                      <input type="hidden" name="imageId" value={image.id} />
                      <input
                        type="hidden"
                        name="mode"
                        value={image.isEnabled ? "disable" : "enable"}
                      />
                      <Button type="submit" variant="outline" size="sm" className="rounded-full px-4">
                        {image.isEnabled ? "Disable" : "Enable"}
                      </Button>
                    </form>
                    <form action={deleteHomepageCarouselImageAction} className="ml-auto">
                      <input type="hidden" name="imageId" value={image.id} />
                      <Button type="submit" variant="destructive" size="sm" className="rounded-full px-4">
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
