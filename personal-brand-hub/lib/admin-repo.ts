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

/** 삭제 = FeedCard 행 제거 + 활성 SuppressionRecord 기록 (방식 B). 원자적. */
export async function deleteCard(originalUrl: string, actor: string, reason?: string) {
  const card = await prisma.feedCard.findUnique({ where: { originalUrl } })
  await prisma.$transaction([
    prisma.feedCard.deleteMany({ where: { originalUrl } }),
    prisma.suppressionRecord.upsert({
      where: { originalUrl },
      update: { restoredAt: null, deletedAt: new Date(), deletedBy: actor, reason: reason ?? null, vaultPath: card?.vaultPath ?? null },
      create: { originalUrl, vaultPath: card?.vaultPath ?? null, deletedBy: actor, reason: reason ?? null },
    }),
  ])
  await audit("DELETE", originalUrl, actor, reason)
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
  await prisma.$transaction(ops)
  await audit("RESTORE", originalUrl, actor)
}

export async function editCard(originalUrl: string, title: string, excerpt: string, actor: string) {
  await prisma.feedCard.update({ where: { originalUrl }, data: { title, excerpt: excerpt || null } })
  await audit("EDIT", originalUrl, actor)
}

/** "지금 클리핑" — 트리거 파일만 기록(web→python 직접 spawn 금지). systemd path-unit이 감지해 실행. */
export async function triggerClip(actor: string) {
  const f = process.env.SWARM56_CLIP_TRIGGER || "/var/lib/swarm56/triggers/clip.now"
  try {
    fs.mkdirSync(path.dirname(f), { recursive: true })
    fs.writeFileSync(f, String(Date.now()))
  } catch {
    /* 트리거 디렉토리 없으면 무시(로컬) */
  }
  await audit("CLIP_NOW", null, actor)
}
