import { prisma } from "@/lib/db/prisma";
import type { FeedCardView } from "@/types/post";

const activeCardSelect = {
  id: true,
  channel: true,
  title: true,
  excerpt: true,
  thumbnailPath: true,
  thumbnailKind: true,
  originalUrl: true,
  publishedAt: true,
} as const;

// 공개 노출: status=ACTIVE, 최신순
export async function findActiveCards(): Promise<FeedCardView[]> {
  const rows = await prisma.feedCard.findMany({
    where: { status: "ACTIVE" },
    select: activeCardSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows as FeedCardView[];
}

// 채널별 최신 N개 (Social Hub Grid용, R5에서 사용)
export async function findActiveCardsByChannel(
  limitPerChannel = 5
): Promise<Record<string, FeedCardView[]>> {
  const rows = await findActiveCards();
  const byChannel: Record<string, FeedCardView[]> = {};
  for (const row of rows) {
    const list = (byChannel[row.channel] ??= []);
    if (list.length < limitPerChannel) list.push(row);
  }
  return byChannel;
}
