import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seeds = [
  {
    slug: "welcome-to-swarm56",
    title: "swarm56에 오신 것을 환영합니다",
    excerpt: "개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다.",
    content:
      "swarm56은 원종석의 공개 활동을 기록하는 개인 브랜드 허브입니다. " +
      "소프트웨어, 업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로를 직접 실험하고 기록합니다.",
    status: "published",
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
  },
  {
    slug: "building-with-ai",
    title: "AI와 함께 시스템을 만드는 방법",
    excerpt: "에이전트 협업 워크플로우를 직접 구축하면서 배운 것들을 기록합니다.",
    content:
      "GPT 오케스트레이터와 Claude Code 실행 모델을 조합해 웹 인프라를 구축했습니다. " +
      "각 에이전트가 명확한 역할을 가질 때 협업 품질이 높아진다는 것을 확인했습니다.",
    status: "published",
    publishedAt: new Date("2026-06-15T00:00:00.000Z"),
  },
  {
    slug: "draft-internal-note",
    title: "내부 메모 — 비공개",
    excerpt: null,
    content: "이 글은 아직 발행되지 않은 초안입니다.",
    status: "draft",
    publishedAt: null,
  },
] as const;

async function main() {
  console.log("Seeding database...");

  for (const seed of seeds) {
    const post = await prisma.post.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        excerpt: seed.excerpt ?? null,
        content: seed.content,
        status: seed.status,
        publishedAt: seed.publishedAt ?? null,
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        excerpt: seed.excerpt ?? null,
        content: seed.content,
        status: seed.status,
        publishedAt: seed.publishedAt ?? null,
      },
    });
    console.log(`  upserted: ${post.slug} (id: ${post.id})`);
  }

  console.log(`Seeding complete. Total upserted: ${seeds.length}`);
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
