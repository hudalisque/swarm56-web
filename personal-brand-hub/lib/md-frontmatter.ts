import fs from "fs"
import path from "path"

/** 서버 옵시디언 볼트 루트 (읽기 전용 — 복원 시 md frontmatter 재파싱용). */
export function vaultRoot(): string {
  return process.env.SWARM56_VAULT_DIR || ""
}

export function parseFrontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
  if (!m) return {}
  const fm: Record<string, string> = {}
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^(\w+):\s*"(.*)"\s*$/)
    if (mm) fm[mm[1]] = mm[2]
  }
  return fm
}

/** 볼트 md(relPath)의 frontmatter 읽기. traversal 차단. (읽기 전용 — 볼트에 안 씀)
 *  볼트는 프로젝트 밖 런타임 경로 → path/fs 호출에 turbopackIgnore 코멘트로 NFT 과추적 방지. */
export function readVaultMd(relPath: string): Record<string, string> | null {
  const root = vaultRoot()
  if (!root || !relPath) return null
  const base = path.resolve(/*turbopackIgnore: true*/ root)
  const full = path.resolve(/*turbopackIgnore: true*/ base, relPath)
  if (full !== base && !full.startsWith(base + path.sep)) return null // traversal 방지
  try {
    return parseFrontmatter(fs.readFileSync(/*turbopackIgnore: true*/ full, "utf-8"))
  } catch {
    return null
  }
}
