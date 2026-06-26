"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          오류가 발생했습니다
        </h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
