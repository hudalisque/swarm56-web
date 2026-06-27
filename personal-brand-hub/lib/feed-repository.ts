import { prisma } from "@/lib/prisma";
import type { ChannelId, FeedItem } from "@/lib/feed-data";

// DB 채널 enum(대문자) → v0 ChannelId(소문자)
const DB_TO_ID: Record<string, ChannelId> = {
  NAVER_BLOG: "naver",
  NOTION: "notion",
  YOUTUBE: "youtube",
  GITHUB: "github",
  LINKEDIN: "linkedin",
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  SWARM: "swarm",
};

function ymd(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

// SQLite FeedCard(ACTIVE) → 채널별 v0 FeedItem (채널당 최신 5개)
export async function getItemsByChannel(): Promise<
  Record<ChannelId, FeedItem[]>
> {
  const rows = await prisma.feedCard.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      channel: true,
      title: true,
      excerpt: true,
      originalUrl: true,
      publishedAt: true,
      thumbnailPath: true,
      thumbnailKind: true,
    },
  });

  const out = {} as Record<ChannelId, FeedItem[]>;
  for (const r of rows) {
    const id = DB_TO_ID[r.channel];
    if (!id) continue;
    const list = (out[id] ??= []);
    if (list.length >= 5) continue;
    list.push({
      title: r.title,
      excerpt: r.excerpt ?? "",
      date: ymd(r.publishedAt),
      url: r.originalUrl,
      thumbnail:
        r.thumbnailKind === "ORIGINAL" && r.thumbnailPath ? r.thumbnailPath : "",
    });
  }
  return out;
}
