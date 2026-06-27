'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { navItems, socialLinks } from '@/lib/site'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5">
        {/* Logo */}
        <a
          href="#top"
          className="rounded-md text-base font-semibold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Jongseok Won
        </a>

        {/* Center anchors (desktop) */}
        <nav
          aria-label="주요 섹션"
          className="absolute left-1/2 hidden -translate-x-1/2 md:block"
        >
          <ul className="flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: social icons (desktop) */}
        <div className="hidden items-center gap-1 md:flex">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (새 탭)`}
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <link.icon className="size-[18px]" aria-hidden="true" />
            </a>
          ))}
        </div>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="모바일 메뉴"
            className="fixed right-0 top-0 z-50 flex h-full w-[80%] max-w-xs flex-col bg-background p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-ink">
                Jongseok Won
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="메뉴 닫기"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="모바일 주요 섹션" className="mt-6">
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto flex items-center gap-2 border-t border-border pt-5">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.label} (새 탭)`}
                  className="flex size-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <link.icon className="size-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
