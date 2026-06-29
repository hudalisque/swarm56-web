import fs from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"
import { readVaultMd } from "@/lib/md-frontmatter"

// frontmatter thumbnail(_assets/x.webp) → 웹 경로 /vault/<채널>/_assets/x.webp (Nginx alias)
function thumbWeb(channel: string, thumb?: string | null): string | null {
  return thumb ? `/vault/${channel.toLowerCase()}/${thumb}` : null
}

export async function listCards() {
  return prisma.feedCard.findMany({ orderBy: [{ publishedAt: "desc" }], take: 500 })
}
export async function listSuppressed() {
  return prisma.suppressionRecord.findMany({ where: { restoredAt: null }, orderBy: { deletedAt: "desc" } })
}
export async function listSyncRuns() {
  return prisma.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 })
}

export async function audit(action: string, target: string | null, actor: string, detail?: string) {
  await prisma.adminAudit.create({ data: { action, target, actor, detail: detail ?? null } })
}

/** 삭제 = FeedCard 행 제거 + 활성 SuppressionRecord 기록 + 감사로그 (방식 B). 셋 다 한 트랜잭션(원자적). */
export async function deleteCard(originalUrl: string, actor: string, reason?: string) {
  const card = await prisma.feedCard.findUnique({ where: { originalUrl } })
  await prisma.$transaction([
    prisma.feedCard.deleteMany({ where: { originalUrl } }),
    prisma.suppressionRecord.upsert({
      where: { originalUrl },
      update: { restoredAt: null, deletedAt: new Date(), deletedBy: actor, reason: reason ?? null, vaultPath: card?.vaultPath ?? null },
      create: { originalUrl, vaultPath: card?.vaultPath ?? null, deletedBy: actor, reason: reason ?? null },
    }),
    prisma.adminAudit.create({ data: { action: "DELETE", target: originalUrl, actor, detail: reason ?? null } }),
  ])
}

/** 복원 = tombstone 해제 + 볼트 md에서 카드 재삽입 (하나의 원자적 작업). */
export async function restoreCard(originalUrl: string, actor: string) {
  const sup = await prisma.suppressionRecord.findUnique({ where: { originalUrl } })
  const fm = sup?.vaultPath ? readVaultMd(sup.vaultPath) : null
  const ops: any[] = [
    prisma.suppressionRecord.update({ where: { originalUrl }, data: { restoredAt: new Date() } }),
  ]
  if (fm && fm.url) {
    const channel = fm.channel || (fm.source || "").toUpperCase()
    const data = {
      channel,
      title: fm.title || "(제목 없음)",
      excerpt: fm.excerpt || null,
      thumbnailPath: thumbWeb(channel, fm.thumbnail || null),
      originalUrl: fm.url,
      vaultPath: sup?.vaultPath ?? null,
      publishedAt: fm.published ? new Date(fm.published) : new Date(),
      externalId: fm.external_id || null,
    }
    ops.push(prisma.feedCard.upsert({ where: { originalUrl }, update: data, create: data }))
  }
  // 감사로그도 같은 트랜잭션에 포함 → 복원과 audit 원자성 보장
  ops.push(prisma.adminAudit.create({ data: { action: "RESTORE", target: originalUrl, actor, detail: null } }))
  await prisma.$transaction(ops)
}

export async function editCard(originalUrl: string, title: string, excerpt: string, actor: string) {
  await prisma.$transaction([
    prisma.feedCard.update({ where: { originalUrl }, data: { title, excerpt: excerpt || null } }),
    prisma.adminAudit.create({ data: { action: "EDIT", target: originalUrl, actor, detail: null } }),
  ])
}

/** 트리거 파일 1건 기록 (web→python 직접 spawn 금지; systemd path-unit이 감지해 실행).
 *  볼트/트리거는 프로젝트 밖 런타임 경로 → fs/path 호출에 turbopackIgnore 코멘트(NFT 과추적 방지).
 *  쓰기 실패 시 성공 위장하지 않고 실패 audit + 에러 전파. */
async function writeTrigger(filePath: string, action: string, actor: string) {
  try {
    fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(filePath), { recursive: true })
    fs.writeFileSync(/*turbopackIgnore: true*/ filePath, String(Date.now()))
  } catch (e) {
    await audit(`${action}_FAILED`, null, actor, String(e))
    throw new Error(`${action} 트리거 기록 실패: ${e}`)
  }
  await audit(action, null, actor)
}

/** "지금 클리핑" — 트리거 파일 기록. systemd path-unit이 감지해 에이전트 실행. */
export async function triggerClip(actor: string) {
  await writeTrigger(process.env.SWARM56_CLIP_TRIGGER || "/var/lib/swarm56/triggers/clip.now", "CLIP_NOW", actor)
}

/** "강제 갱신"(#10) — force 트리거 파일 기록. systemd path-unit이 SWARM56_FORCE=1로 에이전트 실행. */
export async function triggerForceReclip(actor: string) {
  await writeTrigger(process.env.SWARM56_FORCE_TRIGGER || "/var/lib/swarm56/triggers/force.now", "FORCE_RECLIP", actor)
}
