import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { PostList } from "@/components/post-list";
import { SiteFooter } from "@/components/site-footer";
import { findPublishedPosts } from "@/lib/repositories/post-repository";

const CHANNELS = [
  {
    name: "Blog",
    role: "긴 글, 복귀 과정, 프로젝트 기록",
    url: "https://blog.naver.com/acepetra",
  },
  {
    name: "GitHub",
    role: "코드와 프로젝트 결과물",
    url: "https://github.com/hudalisque/ai_team",
  },
  {
    name: "LinkedIn",
    role: "비즈니스 프로필과 네트워크",
    url: "https://www.linkedin.com/in/peter-jong-suk-won-08588239",
  },
  {
    name: "Notion",
    role: "작업 메모와 정리된 기록",
    url: "https://river-perfume-8d6.notion.site/f75cf5da3cbb4823bbe642a199a6f462?v=4087b243c83a4398adff8a1c61ce8d3f",
  },
  {
    name: "Instagram",
    role: "짧은 작업 기록과 스냅샷",
    url: "https://www.instagram.com/hudalisque",
  },
  {
    name: "Facebook",
    role: "기존 네트워크와 근황 공유",
    url: "https://www.facebook.com/share/1GzASnaNjK/",
  },
] as const;

const PROJECTS = [
  {
    name: "ai_team",
    description:
      "AI 협업형 개발 워크플로 실험 프로젝트입니다. 기획, 구현, 검토, 기록을 분리해 실제 개발 업무에 적용하는 방식을 실험합니다.",
    tags: ["Software", "Workflow", "GitHub", "Build log"],
    link: { label: "GitHub →", url: "https://github.com/hudalisque/ai_team" },
  },
  {
    name: "Intelligence Brief",
    description:
      "기업과 시장을 검토하기 위한 정보 수집, 정리, 분석 문서 작업입니다. 의사결정에 필요한 맥락과 판단 근거를 정리하는 데 초점을 둡니다.",
    tags: ["Business intelligence", "Research", "Briefing", "Decision support"],
    link: null,
  },
  {
    name: "Small Vill",
    description:
      "소상공인과 작은 조직이 AI와 자동화 도구를 실제 업무에 적용하는 방식을 탐색합니다. 복잡한 기술보다 일상 업무에서 바로 이해하고 쓸 수 있는 형태를 지향합니다.",
    tags: ["Small business", "AI adoption", "Workflow", "Product concept"],
    link: null,
  },
] as const;

export default async function HomePage() {
  await connection();
  const posts = await findPublishedPosts();

  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />

        {/* About */}
        <section id="about" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">About</h2>
            <div className="max-w-2xl space-y-4 text-slate-700 leading-relaxed">
              <p>
                저는 개발자로 일을 시작했고, 이후 회사를 만들고 운영하며
                Founder, CEO, CFO 역할을 경험했습니다. 오랫동안 사업과 운영의
                현장에 있었지만, 지금은 다시 직접 코드를 쓰고 시스템을 만들고
                있습니다.
              </p>
              <p>
                현재의 관심사는 소프트웨어 개발, 업무 자동화, 비즈니스
                인텔리전스, 그리고 AI를 실제 업무에 어떻게 적용할 수
                있는가입니다. 이 사이트는 그 과정에서 만든 프로젝트, 글, 코드,
                작업 기록을 모아두는 공간입니다.
              </p>
            </div>
            <ul
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10"
              role="list"
            >
              {[
                "Started as a developer",
                "Built and operated companies",
                "Returned to hands-on software work",
                "Writing and building in public",
              ].map((item) => (
                <li
                  key={item}
                  className="border border-slate-200 rounded p-4 text-sm text-slate-600 leading-snug"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Current Work */}
        <section id="work" className="bg-slate-50 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-10">
              Current Work
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Software</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  개인 프로젝트와 개발 복귀 과정을 GitHub 기반으로 실험하고
                  기록합니다.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Business Intelligence
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  기업·시장·투자 검토를 위한 정보 정리와 리서치, 판단을 돕는
                  문서화를 진행합니다.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Workflow &amp; Automation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  반복 업무 자동화와 사람이 판단하고 도구가 보조하는 구조를
                  만듭니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-10">
              Projects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PROJECTS.map((project) => (
                <article
                  key={project.name}
                  className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-300 flex flex-col"
                >
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {project.link && (
                    <a
                      href={project.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:underline"
                    >
                      {project.link.label}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Writing — DB Posts */}
        <section id="writing" className="bg-slate-50 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-10">
              최근 기록
            </h2>
            <PostList posts={posts} />
          </div>
        </section>

        {/* Writing & Channels */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Writing &amp; Channels
            </h2>
            <p className="text-sm text-slate-600 mb-10 max-w-xl leading-relaxed">
              긴 글은 블로그에, 코드는 GitHub에, 비즈니스 프로필은 LinkedIn에
              정리합니다. 작업 메모와 짧은 기록은 Notion, Instagram, Facebook으로
              나눠서 남깁니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHANNELS.map((ch) => (
                <a
                  key={ch.name}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-slate-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow duration-300 flex flex-col gap-1"
                >
                  <span className="font-semibold text-slate-900 text-sm">
                    {ch.name}
                  </span>
                  <span className="text-xs text-slate-500">{ch.role}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="bg-slate-50 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact</h2>
            <p className="text-slate-600 max-w-xl mb-8 leading-relaxed">
              협업, 자문, 프로젝트 논의는 LinkedIn으로 연락해 주세요.
              소프트웨어, 업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로에
              관한 대화를 환영합니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/peter-jong-suk-won-08588239"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors"
              >
                LinkedIn에서 연락하기
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
                href="https://blog.naver.com/acepetra"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded hover:border-slate-400 hover:bg-white transition-colors"
              >
                Blog 보기
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
