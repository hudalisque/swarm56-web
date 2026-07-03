import { redirect } from "next/navigation"
import { isAuthed } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { listCards, listSuppressed, listSyncRuns } from "@/lib/admin-repo"
import { logoutAction, clipNowAction, forceReclipAction, deleteAction, restoreAction } from "./actions"
import { EditCard } from "./edit-card"

export const dynamic = "force-dynamic"

// KST(Asia/Seoul) 기준 YYYY-MM-DD HH:MM 표기. (toISOString은 UTC라 +9h가 반영 안 됨)
function ymd(d: Date) {
  return new Date(d).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 16)
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ req?: string }> }) {
  if (!(await isAuthed())) redirect("/admin/login")

  const sp = await searchParams
  const reqMsg =
    sp.req === "clip" ? "클리핑을 요청했습니다 — 결과는 아래 SyncRun 로그에 곧 반영됩니다."
    : sp.req === "force" ? "강제 갱신을 요청했습니다 — 결과는 아래 SyncRun 로그에 곧 반영됩니다."
    : null

  const [cards, suppressed, runs, audits] = await Promise.all([
    listCards(),
    listSuppressed(),
    listSyncRuns(),
    prisma.adminAudit.findMany({ orderBy: { at: "desc" }, take: 30 }),
  ])

  return (
    <div className="mx-auto max-w-5xl p-6 text-neutral-900">
      {reqMsg && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{reqMsg}</div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">swarm56 Admin</h1>
          <p className="text-sm text-neutral-500">카드 {cards.length} · 숨김(suppressed) {suppressed.length}</p>
        </div>
        <div className="flex gap-2">
          <form action={clipNowAction}>
            <button className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700">지금 클리핑</button>
          </form>
          <form action={forceReclipAction}>
            <button className="rounded-md border border-amber-400 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50">강제 갱신</button>
          </form>
          <form action={logoutAction}>
            <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">로그아웃</button>
          </form>
        </div>
      </div>

      {/* 카드 */}
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">카드</h2>
      <div className="mb-8 space-y-2">
        {cards.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{c.channel}</span>
              <a href={c.originalUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm font-medium hover:underline">{c.title}</a>
              <span className="text-xs text-neutral-400">{ymd(c.publishedAt)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <EditCard originalUrl={c.originalUrl} title={c.title} excerpt={c.excerpt} />
              <details className="inline">
                <summary className="cursor-pointer rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">삭제</summary>
                <form action={deleteAction} className="mt-2 flex flex-col gap-2">
                  <input type="hidden" name="originalUrl" value={c.originalUrl} />
                  <input name="reason" placeholder="사유(선택)" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
                  <button className="self-start rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500">정말 삭제(숨김 보존)</button>
                </form>
              </details>
            </div>
          </div>
        ))}
      </div>

      {/* 숨김(suppressed) — 복원 */}
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">숨김(삭제됨) — 복원</h2>
      <div className="mb-8 space-y-2">
        {suppressed.length === 0 && <p className="text-sm text-neutral-400">없음</p>}
        {suppressed.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <a href={s.originalUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm hover:underline">{s.originalUrl}</a>
            <span className="text-xs text-neutral-500">{ymd(s.deletedAt)} · {s.deletedBy}</span>
            <form action={restoreAction}>
              <input type="hidden" name="originalUrl" value={s.originalUrl} />
              <button className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-white">복원</button>
            </form>
          </div>
        ))}
      </div>

      {/* SyncRun 로그 */}
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">SyncRun (최근)</h2>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-neutral-500"><th className="p-1">시작</th><th>채널</th><th>상태</th><th>fetched</th><th>upserted</th><th>skipped</th><th>err</th></tr></thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="p-1">{ymd(r.startedAt)}</td><td>{r.channel ?? "(derive)"}</td><td>{r.status}</td>
                <td>{r.fetchedCount}</td><td>{r.upsertedCount}</td><td>{r.skippedCount}</td><td>{r.errorCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 감사 로그 */}
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">감사 로그 (who/when/target)</h2>
      <div className="space-y-1 text-xs text-neutral-600">
        {audits.map((a) => (
          <div key={a.id} className="flex gap-2 border-t border-neutral-100 py-1">
            <span className="text-neutral-400">{ymd(a.at)}</span>
            <span className="font-medium">{a.action}</span>
            <span className="text-neutral-500">{a.actor}</span>
            <span className="flex-1 truncate">{a.target ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
