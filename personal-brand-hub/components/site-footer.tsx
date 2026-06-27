import { socialLinks } from '@/lib/site'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          © {year} Jongseok Won · swarm56.com
        </p>
        <div className="flex items-center gap-1">
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
      </div>
    </footer>
  )
}
