import assert from "node:assert/strict";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function run() {
  console.log(`=== Phase 2.4 Smoke Test (${BASE_URL}) ===\n`);

  // 1. GET / → 200
  const home = await fetch(`${BASE_URL}/`);
  assert.equal(home.status, 200, "GET / should return 200");
  const homeText = await home.text();
  console.log(`[1] GET / → ${home.status} ✅`);

  // 2. 공개 Post 2건 렌더링
  assert.ok(
    homeText.includes("swarm56에 오신"),
    "Published post 1 should be visible"
  );
  assert.ok(
    homeText.includes("AI와 함께 시스템"),
    "Published post 2 should be visible"
  );
  console.log(`[2] Published posts 2건 렌더링 ✅`);

  // 3. Draft 미노출
  assert.ok(
    !homeText.includes("draft-internal-note"),
    "Draft slug must not appear in HTML"
  );
  assert.ok(
    !homeText.includes("내부 메모 — 비공개"),
    "Draft title must not appear in HTML"
  );
  console.log(`[3] Draft 미노출 ✅`);

  // 4. Homepage 비밀정보 미노출
  assert.ok(!homeText.includes("DATABASE_URL"), "DATABASE_URL must not appear");
  assert.ok(!homeText.includes("dev.db"), "DB file path must not appear");
  assert.ok(
    !homeText.match(/[A-Z]:\\.*\\prisma/),
    "Absolute prisma path must not appear"
  );
  console.log(`[4] Homepage 비밀정보 미노출 ✅`);

  // 5. GET /api/health → 200 + JSON
  const health = await fetch(`${BASE_URL}/api/health`);
  assert.equal(health.status, 200, "GET /api/health should return 200");
  const healthBody = (await health.json()) as Record<string, unknown>;
  assert.ok("status" in healthBody, 'Health response must have "status" field');
  assert.ok("db" in healthBody, 'Health response must have "db" field');
  assert.equal(
    healthBody.db,
    "ok",
    `DB health must be "ok", got: ${healthBody.db}`
  );
  console.log(
    `[5] GET /api/health → { status: "${healthBody.status}", db: "${healthBody.db}" } ✅`
  );

  // 6. Health 내부 정보 미노출
  const healthText = JSON.stringify(healthBody);
  assert.ok(!healthText.includes("DATABASE_URL"), "Health must not expose DATABASE_URL");
  assert.ok(!healthText.includes(".db"), "Health must not expose DB file path");
  assert.ok(
    !healthText.toLowerCase().includes("stack"),
    "Health must not expose stack trace"
  );
  assert.ok(
    !healthText.toLowerCase().includes("at prisma"),
    "Health must not expose Prisma internals"
  );
  console.log(`[6] Health 내부 정보 미노출 ✅`);

  // 7. GET /non-existent-page → 404
  const notFound = await fetch(`${BASE_URL}/non-existent-page`);
  assert.equal(notFound.status, 404, "Non-existent page should return 404");
  console.log(`[7] GET /non-existent-page → 404 ✅`);

  // 8. GET /api/health content-type is application/json
  const ct = health.headers.get("content-type") ?? "";
  assert.ok(ct.includes("application/json"), "Health response must be JSON");
  console.log(`[8] Health Content-Type: ${ct} ✅`);

  // 9. Homepage Content-Type is text/html
  const homeCt = home.headers.get("content-type") ?? "";
  assert.ok(homeCt.includes("text/html"), "Homepage must return HTML");
  console.log(`[9] Homepage Content-Type: ${homeCt} ✅`);

  // 10. Homepage에 Hero copy 포함
  assert.ok(
    homeText.includes("개발자로 시작해 회사를 운영했고"),
    "Hero copy must appear"
  );
  console.log(`[10] Hero copy 렌더링 ✅`);

  console.log(`\n=== All 10 smoke tests passed ✅ ===\n`);
}

run().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Smoke test failed:", msg);
  process.exit(1);
});
