import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-slate-900 hover:text-blue-700 transition-colors"
        >
          Jongseok Won
        </Link>
        <nav aria-label="주요 메뉴" className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
          <a href="#about" className="hover:text-slate-900 transition-colors">About</a>
          <a href="#work" className="hover:text-slate-900 transition-colors">Work</a>
          <a href="#projects" className="hover:text-slate-900 transition-colors">Projects</a>
          <a href="#writing" className="hover:text-slate-900 transition-colors">Writing</a>
          <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
        </nav>
        <a
          href="https://www.linkedin.com/in/peter-jong-suk-won-08588239"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm border border-blue-700 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-700 hover:text-white transition-colors"
        >
          LinkedIn
        </a>
      </div>
    </header>
  );
}
