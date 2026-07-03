"use client"

import { useActionState, useEffect, useRef } from "react"
import { editAction } from "./actions"

type Props = { originalUrl: string; title: string; excerpt: string | null }

/** 편집 disclosure — 저장 성공 시 <details>를 자동으로 닫는다.
 *  (서버액션 revalidate는 제자리 갱신이라 비제어 <details open> 상태가 보존되므로 클라에서 닫아준다.) */
export function EditCard({ originalUrl, title, excerpt }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [state, formAction, pending] = useActionState(editAction, null)

  useEffect(() => {
    if (state?.ok && detailsRef.current) detailsRef.current.open = false
  }, [state])

  return (
    <details ref={detailsRef} className="inline">
      <summary className="cursor-pointer rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100">편집</summary>
      <form action={formAction} className="mt-2 flex flex-col gap-2">
        <input type="hidden" name="originalUrl" value={originalUrl} />
        <input name="title" defaultValue={title} className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
        <textarea name="excerpt" defaultValue={excerpt ?? ""} rows={2} className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
        <button disabled={pending} className="self-start rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
          {pending ? "저장 중…" : "저장"}
        </button>
      </form>
    </details>
  )
}
