export const POST_STATUSES = ["draft", "published"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export type PublishedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  publishedAt: Date;
  updatedAt: Date;
};
