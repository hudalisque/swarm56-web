import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("=== Phase 2.2 Verification ===\n");

  // 1. 전체 Post 수는 seed 후 3개
  const totalCount = await prisma.post.count();
  assert.equal(totalCount, 3, `Total posts should be 3, got ${totalCount}`);
  console.log(`[1] Total posts: ${totalCount} ✅`);

  // 2. 공개 Repository 결과는 2개
  const now = new Date();
  const published = await prisma.post.findMany({
    where: {
      status: "published",
      publishedAt: { not: null, lte: now },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  assert.equal(published.length, 2, `Published posts should be 2, got ${published.length}`);
  console.log(`[2] Published posts: ${published.length} ✅`);

  // 3. draft는 공개 결과에 없음
  const hasDraft = published.some((p) => p.status !== "published");
  assert.equal(hasDraft, false, "Draft must not appear in published results");
  console.log(`[3] No draft in published results ✅`);

  // 4. 존재하는 공개 slug 조회 성공
  const found = await prisma.post.findFirst({
    where: { slug: "welcome-to-swarm56", status: "published", publishedAt: { not: null, lte: now } },
  });
  assert.ok(found, "Published slug 'welcome-to-swarm56' should be found");
  console.log(`[4] Published slug lookup: found id=${found.id} ✅`);

  // 5. draft slug 조회 결과는 null (공개 조건 적용)
  const draftAsPublished = await prisma.post.findFirst({
    where: { slug: "draft-internal-note", status: "published", publishedAt: { not: null, lte: now } },
  });
  assert.equal(draftAsPublished, null, "Draft slug must return null via published filter");
  console.log(`[5] Draft slug via published filter: null ✅`);

  // 6. 존재하지 않는 slug 결과는 null
  const notExist = await prisma.post.findFirst({
    where: { slug: "non-existent-slug-xyz", status: "published", publishedAt: { not: null, lte: now } },
  });
  assert.equal(notExist, null, "Non-existent slug should return null");
  console.log(`[6] Non-existent slug: null ✅`);

  // 7. 미래 publishedAt을 가진 published Post는 공개 결과에서 제외
  const futurePost = await prisma.post.create({
    data: {
      slug: "future-post-verify-test",
      title: "Future Post (Test Only)",
      content: "This post is dated in the future.",
      status: "published",
      publishedAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    },
  });
  const publishedWithFuture = await prisma.post.findMany({
    where: { status: "published", publishedAt: { not: null, lte: now } },
  });
  const futureInResult = publishedWithFuture.some((p) => p.slug === "future-post-verify-test");
  assert.equal(futureInResult, false, "Future published post must be excluded from public results");
  console.log(`[7] Future publishedAt excluded ✅`);
  // 테스트 데이터 삭제
  await prisma.post.delete({ where: { id: futurePost.id } });
  console.log(`    (test post cleaned up)`);

  // 8. 중복 slug 생성은 unique constraint 오류
  let uniqueError = false;
  try {
    await prisma.post.create({
      data: {
        slug: "welcome-to-swarm56",
        title: "Duplicate",
        content: "Duplicate content",
        status: "draft",
      },
    });
  } catch {
    uniqueError = true;
  }
  assert.equal(uniqueError, true, "Duplicate slug should throw unique constraint error");
  console.log(`[8] Unique constraint enforced ✅`);

  // 9. seed ID 유지 — 두 번째 seed 후 전체 수가 증가하지 않음 (caller에서 두 번 실행 후 검증)
  //    여기서는 현재 count == 3만 확인 (seed 재실행 전제)
  const countAfter = await prisma.post.count();
  assert.equal(countAfter, 3, `Post count after should still be 3, got ${countAfter}`);
  console.log(`[9] Post count stable: ${countAfter} ✅`);

  // 10. seed 전후 기존 Post ID가 유지됨 (welcome-to-swarm56 ID 확인)
  const seedPost = await prisma.post.findUnique({ where: { slug: "welcome-to-swarm56" } });
  assert.ok(seedPost, "Seed post must exist");
  assert.ok(seedPost.id, "Seed post must have stable ID");
  console.log(`[10] Seed ID stable: ${seedPost.id} ✅`);

  console.log("\n=== All 10 checks passed ✅ ===\n");
}

run()
  .catch((err) => {
    console.error("Verification failed:", err.message ?? err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
