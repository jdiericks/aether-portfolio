import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LatestPostSectionProps {
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  publishedAt?: Date | string | null;
}

export function LatestPostSection({
  title,
  slug,
  excerpt,
  category,
  publishedAt,
}: LatestPostSectionProps) {
  const publishedDate = publishedAt ? new Date(publishedAt) : null;

  return (
    <section className="border-t px-4 py-16 md:py-20">
      <div className="container mx-auto max-w-5xl">
        <div className="grid gap-6 rounded-3xl border bg-background p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Latest insight
            </p>
            {category && (
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary">
                {category}
              </p>
            )}
            <h2 className="mt-2 text-2xl font-light tracking-tight md:text-3xl">
              <Link href={`/insights/${slug}`} className="hover:underline">
                {title}
              </Link>
            </h2>
            {excerpt && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {excerpt}
              </p>
            )}
            {publishedDate && Number.isFinite(publishedDate.getTime()) && (
              <p className="mt-3 text-xs text-muted-foreground">
                Published {publishedDate.toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild>
              <Link href={`/insights/${slug}`}>Read article</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/insights">View all posts</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
