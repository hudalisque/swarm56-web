export function HeroSection() {
  return (
    <section className="bg-slate-50 py-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-4 tracking-wide">
            Founder · Developer · Operator
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
            개발자로 시작해 회사를 운영했고,
            <br />
            지금은 다시 직접 만들고 있습니다.
          </h1>
          <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-xl">
            Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로
            소프트웨어, 업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로를
            직접 실험하고 기록합니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://blog.naver.com/acepetra"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors"
            >
              블로그 읽기
            </a>
            <a
              href="https://github.com/hudalisque/ai_team"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded hover:border-slate-400 hover:bg-white transition-colors"
            >
              GitHub 보기
            </a>
            <a
              href="https://www.linkedin.com/in/peter-jong-suk-won-08588239"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded hover:border-slate-400 hover:bg-white transition-colors"
            >
              LinkedIn 보기
            </a>
          </div>
        </div>

        <aside
          aria-label="프로필 요약"
          className="w-full lg:w-72 shrink-0 border border-slate-200 rounded-lg bg-white p-6"
        >
          <p className="font-semibold text-slate-900">Jongseok Won</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Founder · Developer · Operator
          </p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Current Focus
          </p>
          <ul className="space-y-2 text-sm text-slate-700" role="list">
            <li>Software projects</li>
            <li>Business intelligence</li>
            <li>Workflow automation</li>
            <li>Public writing</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
