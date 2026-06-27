export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-t border-border bg-card/40"
    >
      <div className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[0.4fr_0.6fr] md:gap-12">
          <h2
            id="about-heading"
            className="text-2xl font-bold tracking-tight text-ink md:text-3xl"
          >
            About
          </h2>
          <div className="space-y-4 text-pretty leading-relaxed text-muted-foreground md:text-lg">
            <p>
              저는 개발자로 커리어를 시작해 직접 회사를 창업하고 Founder, CEO,
              CFO의 역할을 두루 거치며 제품과 조직을 함께 키워왔습니다. 숫자와
              제품, 사람 사이에서 의사결정을 내리는 일을 오래 해왔습니다.
            </p>
            <p>
              지금은 다시 &lsquo;직접 만드는 사람&rsquo;으로 돌아와 소프트웨어,
              비즈니스 인텔리전스, 업무 자동화, 그리고 AI를 활용한 워크플로를
              실험하고 그 과정을 공개적으로 기록하고 있습니다. 이 사이트는 여러
              채널에 흩어진 그 기록을 한곳에서 볼 수 있게 모은 허브입니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
