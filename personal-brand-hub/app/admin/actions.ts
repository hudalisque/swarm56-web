"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  verifyPassword, createSession, destroySession, isAuthed, rateLimited,
} from "@/lib/auth"
import { deleteCard, restoreCard, editCard, triggerClip, triggerForceReclip } from "@/lib/admin-repo"

const ACTOR = "admin"

async function guard() {
  if (!(await isAuthed())) redirect("/admin/login")
}
function refresh() {
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function loginAction(formData: FormData) {
  if (rateLimited("login")) redirect("/admin/login?e=rate")
  const pw = String(formData.get("password") || "")
  if (!(await verifyPassword(pw))) redirect("/admin/login?e=1")
  await createSession()
  redirect("/admin")
}

export async function logoutAction() {
  await destroySession()
  redirect("/admin/login")
}

export async function deleteAction(formData: FormData) {
  await guard()
  const url = String(formData.get("originalUrl") || "")
  const reason = String(formData.get("reason") || "")
  if (url) {
    await deleteCard(url, ACTOR, reason)
    refresh()
  }
}

export async function restoreAction(formData: FormData) {
  await guard()
  const url = String(formData.get("originalUrl") || "")
  if (url) {
    await restoreCard(url, ACTOR)
    refresh()
  }
}

// useActionState용: (prevState, formData) 시그니처. 저장 성공 여부를 반환해 클라가 폼을 닫게 한다.
export async function editAction(_prev: unknown, formData: FormData) {
  await guard()
  const url = String(formData.get("originalUrl") || "")
  const title = String(formData.get("title") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  if (url && title) {
    await editCard(url, title, excerpt, ACTOR)
    refresh()
    return { ok: true }
  }
  return { ok: false }
}

export async function clipNowAction() {
  await guard()
  await triggerClip(ACTOR)
  refresh()
  redirect("/admin?req=clip") // 요청 접수 피드백 (비동기 — 결과는 SyncRun 로그에 반영)
}

export async function forceReclipAction() {
  await guard()
  await triggerForceReclip(ACTOR)
  refresh()
  redirect("/admin?req=force")
}
