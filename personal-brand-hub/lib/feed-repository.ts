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

// SQLite FeedCard → 채널별 FeedItem (채널당 최신 5개).
// v5: status 없음(삭제=행 제거+SuppressionRecord) → FeedCard에 있는 건 모두 노출 대상.
// 썸네일은 thumbnailPath(=/vault/<채널>/_assets/...; Nginx alias가 볼트에서 서빙).
export async function getItemsByChannel(): Promise<
  Record<ChannelId, FeedItem[]>
> {
  const rows = await prisma.feedCard.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      channel: true,
      title: true,
      excerpt: true,
      originalUrl: true,
      publishedAt: true,
      thumbnailPath: true,
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
      thumbnail: r.thumbnailPath ?? "",
    });
  }
  return out;
}
