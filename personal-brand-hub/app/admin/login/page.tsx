import { loginAction } from "../actions"

export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>
}) {
  const { e } = await searchParams
  const msg = e === "rate" ? "시도가 너무 많습니다. 잠시 후 다시." : e ? "비밀번호가 올바르지 않습니다." : null
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-neutral-900">swarm56 Admin</h1>
        {msg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
        <input
          type="password"
          name="password"
          placeholder="관리자 비밀번호"
          autoFocus
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          로그인
        </button>
      </form>
    </div>
  )
}
