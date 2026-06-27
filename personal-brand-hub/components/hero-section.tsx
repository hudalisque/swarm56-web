import { Mail } from 'lucide-react'

const focusItems = ['Software', 'Business Intelligence', 'Workflow Automation']

export function HeroSection() {
  return (
    <section
      id="top"
      className="mx-auto max-w-[1120px] px-5 pt-14 pb-10 md:pt-20 md:pb-16"
    >
      <div className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
        {/* Left: headline */}
        <div>
          <p className="mb-4 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Founder · CEO · CFO · Builder
          </p>
          <h1 className="text-pretty text-3xl font-bold leading-tight tracking-tight text-ink md:text-[2.6rem] md:leading-[1.2]">
            개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다.
          </h1>
          <p className="mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground md:text-lg">
            Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로 소프트웨어,
            업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로를 직접 실험하고
            기록합니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#hub"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              활동 둘러보기
            </a>
            <a
              href="#contact"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              연락하기
            </a>
          </div>
        </div>

        {/* Right: profile card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
          <div className="flex items-center gap-4">
            <img
              src="/images/avatar.png"
              alt="원종석(Jongseok Won) 프로필 사진"
              width={72}
              height={72}
              className="size-[72px] rounded-full border border-border object-cover"
            />
            <div>
              <p className="text-lg font-semibold text-ink">원종석</p>
              <p className="text-sm text-muted-foreground">
                Jongseok Won · Builder
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current focus
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {focusItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm font-medium text-ink"
                >
                  <span
                    className="size-1.5 rounded-full bg-brand"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="#contact"
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-ink-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Mail className="size-4" aria-hidden="true" />
            Contact Me
          </a>
        </div>
      </div>
    </section>
  )
}
