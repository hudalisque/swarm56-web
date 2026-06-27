import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAY = 86_400_000;
const now = Date.now();
const d = (n: number) => new Date(now - n * DAY);

// 로컬 개발용 더미 카드 (옵시디언 클리핑 전 UI 검증용).
// INSTAGRAM은 0건 → 빈 채널 placeholder 검증용.
const cards = [
  { channel: "NAVER_BLOG", title: "네이버 블로그 샘플 글 1", excerpt: "로컬 시드용 더미 글입니다.", originalUrl: "https://blog.naver.com/acepetra/sample1", publishedAt: d(1), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "NAVER_BLOG", title: "네이버 블로그 샘플 글 2", excerpt: "두 번째 더미.", originalUrl: "https://blog.naver.com/acepetra/sample2", publishedAt: d(3), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "YOUTUBE", title: "유튜브 영상 샘플", excerpt: "영상 설명 더미.", originalUrl: "https://youtube.com/watch?v=sample", publishedAt: d(2), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "GITHUB", title: "Release v0.1.0", excerpt: "깃헙 릴리스 더미.", originalUrl: "https://github.com/hudalisque/swarm56-web/releases/tag/v0.1.0", publishedAt: d(4), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "NOTION", title: "노션 페이지 샘플", excerpt: "노션 더미.", originalUrl: "https://notion.so/sample", publishedAt: d(5), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "LINKEDIN", title: "링크드인 포스트 샘플", excerpt: "링크드인 더미.", originalUrl: "https://linkedin.com/posts/sample", publishedAt: d(6), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "FACEBOOK", title: "페이스북 글 샘플", excerpt: "페북 더미.", originalUrl: "https://facebook.com/sample", publishedAt: d(7), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "SWARM", title: "Swarm 체크인 샘플", excerpt: "Foursquare Swarm 체크인 더미.", originalUrl: "https://swarmapp.com/c/sample", publishedAt: d(8), thumbnailKind: "DEFAULT", status: "ACTIVE" },
  { channel: "NAVER_BLOG", title: "비활성 샘플(INACTIVE)", excerpt: "노출 안 됨.", originalUrl: "https://blog.naver.com/acepetra/inactive", publishedAt: d(9), thumbnailKind: "DEFAULT", status: "INACTIVE" },
  { channel: "GITHUB", title: "삭제 샘플(DELETED)", excerpt: "삭제됨.", originalUrl: "https://github.com/hudalisque/swarm56-web/deleted", publishedAt: d(10), thumbnailKind: "DEFAULT", status: "DELETED" },
];

async function main() {
  console.log("Seeding FeedCard...");
  for (const c of cards) {
    await prisma.feedCard.upsert({
      where: { originalUrl: c.originalUrl },
      update: { title: c.title, excerpt: c.excerpt, status: c.status, thumbnailKind: c.thumbnailKind, publishedAt: c.publishedAt },
      create: c,
    });
  }
  const total = await prisma.feedCard.count();
  console.log(`[seed] feedCard upserted: ${cards.length}, total rows: ${total}`);
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
