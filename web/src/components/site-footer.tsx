export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-24">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-sm text-slate-500">© {year} Jongseok Won</p>
        <nav aria-label="소셜 링크" className="flex gap-5 text-sm text-slate-500">
          <a
            href="https://github.com/hudalisque/ai_team"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/peter-jong-suk-won-08588239"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://blog.naver.com/acepetra"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-900 transition-colors"
          >
            Blog
          </a>
        </nav>
      </div>
    </footer>
  );
}
