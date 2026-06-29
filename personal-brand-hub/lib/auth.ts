import { cookies } from "next/headers"
import crypto from "crypto"
import bcrypt from "bcryptjs"

const COOKIE = "swarm56_admin"
const MAX_AGE = 60 * 60 * 12 // 12h

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (s) return s
  // fail-closed: 프로덕션에선 SESSION_SECRET 없으면 즉시 차단(알려진 서명키 fallback 금지)
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET 환경변수가 필요합니다 (프로덕션 fail-closed)")
  }
  // 개발 전용 — 프로덕션 경로에선 위에서 throw됨
  return "dev-only-not-for-production"
}
function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex")
}

/** 비번 검증 — ADMIN_PASSWORD_HASH(bcrypt) 대조. 미설정 시 항상 실패. */
export async function verifyPassword(input: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH || ""
  if (!hash || !input) return false
  try {
    return await bcrypt.compare(input, hash)
  } catch {
    return false
  }
}

export async function createSession(): Promise<void> {
  const exp = String(Date.now() + MAX_AGE * 1000)
  const token = `${exp}.${sign(exp)}`
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function destroySession(): Promise<void> {
  ;(await cookies()).delete(COOKIE)
}

export async function isAuthed(): Promise<boolean> {
  const c = (await cookies()).get(COOKIE)?.value
  if (!c) return false
  const [payload, sig] = c.split(".")
  if (!payload || !sig || sign(payload) !== sig) return false
  const exp = Number(payload)
  return Number.isFinite(exp) && exp > Date.now()
}

// 로그인 무차별 대입 방어 (in-memory, 프로세스 단위)
const attempts = new Map<string, { n: number; ts: number }>()
export function rateLimited(key = "login"): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000
  const max = 5
  const e = attempts.get(key)
  if (!e || now - e.ts > windowMs) {
    attempts.set(key, { n: 1, ts: now })
    return false
  }
  e.n++
  return e.n > max
}
