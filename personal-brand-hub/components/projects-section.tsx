import { ArrowUpRight } from 'lucide-react'

interface Project {
  name: string
  description: string
  tags: string[]
  url: string
}

const projects: Project[] = [
  {
    name: 'swarm56 · 프로젝트 개요',
    description:
      '이 사이트 자체가 프로젝트입니다. 이종 멀티에이전트(설계·디자인·구현·검증)가 협업해 만든 퍼스널 허브 — 워크플로우·아키텍처를 정리한 프로젝트 개요 문서.',
    tags: ['Multi-Agent', 'Next.js', 'Case Study'],
    url: '/docs/project-overview.html',
  },
  {
    name: 'Small Vill 메타연구',
    description:
      '"Small Vill" 개발을 위한 멀티에이전트 메타연구 보고서. 연구 방향과 분석을 정리한 문서입니다.',
    tags: ['Multi-Agent', 'Meta Research', 'Report'],
    url: '/docs/small-vill-meta-research.html',
  },
  {
    name: 'Auto Report',
    description:
      '매월 반복되는 정산·운영 리포트를 자동으로 생성하고 메일로 발송하는 도구. 소규모 팀의 반복 업무를 줄이기 위해 만들었습니다.',
    tags: ['Workflow Automation', 'Node.js', 'OSS'],
    url: 'https://github.com/swarm56/auto-report',
  },
]

export function ProjectsSection() {
  return (
    <section
      id="work"
      aria-labelledby="projects-heading"
      className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-12 md:py-16"
    >
      <div id="projects" className="scroll-mt-20">
        <h2
          id="projects-heading"
          className="text-2xl font-bold tracking-tight text-ink md:text-3xl"
        >
          Work / Projects
        </h2>
        <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          직접 만들고 운영하며 다듬어온 대표 프로젝트들입니다.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3">
        {projects.map((project) => (
          <a
            key={project.name}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.name} 프로젝트 열기 (새 탭)`}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-ink">{project.name}</h3>
              <ArrowUpRight
                className="size-5 text-muted-foreground transition-colors group-hover:text-brand"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </section>
  )
}
