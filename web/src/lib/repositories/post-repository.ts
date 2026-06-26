import { prisma } from "@/lib/db/prisma";
import type { PublishedPost } from "@/types/post";

const publishedWhereClause = {
  status: "published",
  publishedAt: {
    not: null,
    lte: new Date(),
  },
} as const;

const publishedSelectFields = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  publishedAt: true,
  updatedAt: true,
} as const;

export async function findPublishedPosts(): Promise<PublishedPost[]> {
  const posts = await prisma.post.findMany({
    where: publishedWhereClause,
    select: publishedSelectFields,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return posts as PublishedPost[];
}

export async function findPublishedPostBySlug(
  slug: string
): Promise<PublishedPost | null> {
  const post = await prisma.post.findFirst({
    where: {
      slug,
      ...publishedWhereClause,
    },
    select: publishedSelectFields,
  });
  return post as PublishedPost | null;
}
