"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  verifyPassword, createSession, destroySession, isAuthed, rateLimited,
} from "@/lib/auth"
import { deleteCard, restoreCard, editCard, triggerClip, triggerForceReclip, addProjectCard, deleteProjectCard } from "@/lib/admin-repo"

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

/** 프로젝트 카드 추가: 제목·요약·HTML(카드)·MD(볼트)·태그.
 *  redirect는 try 밖에서 — NEXT_REDIRECT가 catch에 삼켜지지 않게. 실패 사유는 배너+감사로그. */
export async function addProjectCardAction(formData: FormData) {
  await guard()
  const title = String(formData.get("title") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const tags = String(formData.get("tags") || "").trim()
  const html = formData.get("html")
  const md = formData.get("md")

  let err: string | null = null
  if (!title || !description || !(html instanceof File) || !(md instanceof File) || html.size === 0 || md.size === 0) {
    err = "제목·요약·HTML·MD는 모두 필수입니다"
  } else {
    try {
      await addProjectCard({ title, description, tags, html, md }, ACTOR)
    } catch (e) {
      err = e instanceof Error ? e.message : String(e)
    }
  }
  refresh()
  if (err) redirect(`/admin?req=cardfail&msg=${encodeURIComponent(err.slice(0, 200))}`)
  redirect("/admin?req=card")
}

/** 프로젝트 카드 삭제 — 파일(HTML·볼트 md)까지 제거해 동일 파일명 재업로드(수정 워크플로우) 가능. */
export async function deleteProjectCardAction(formData: FormData) {
  await guard()
  const id = String(formData.get("id") || "")
  let err: string | null = null
  if (!id) {
    err = "카드 id 없음"
  } else {
    try {
      await deleteProjectCard(id, ACTOR)
    } catch (e) {
      err = e instanceof Error ? e.message : String(e)
    }
  }
  refresh()
  if (err) redirect(`/admin?req=cardfail&msg=${encodeURIComponent(err.slice(0, 200))}`)
  redirect("/admin?req=carddel")
}
