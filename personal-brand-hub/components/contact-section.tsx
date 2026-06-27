import { socialLinks } from '@/lib/site'

export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="border-t border-border bg-card/40"
    >
      <div className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="contact-heading"
            className="text-2xl font-bold tracking-tight text-ink md:text-3xl"
          >
            Contact
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground md:text-lg">
            새로운 실험, 협업, 또는 그냥 대화도 환영합니다. 아래 채널 어디로든
            편하게 연락 주세요.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <link.icon className="size-[18px]" aria-hidden="true" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
