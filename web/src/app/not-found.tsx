import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p
          className="text-8xl font-bold text-slate-200 select-none"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
