-- CreateTable
CREATE TABLE "ProjectCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "docPath" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCard_docPath_key" ON "ProjectCard"("docPath");

-- Seed: 기존 하드코딩 카드 3장 이관 (projects-section.tsx 값 그대로, createdAt asc = 표시 순서)
INSERT INTO "ProjectCard" ("id", "title", "description", "docPath", "tags", "createdAt", "updatedAt") VALUES
('seed-project-overview', 'swarm56 · 프로젝트 개요', '이 사이트 자체가 프로젝트입니다. 이종 멀티에이전트(설계·디자인·구현·검증)가 협업해 만든 퍼스널 허브 — 워크플로우·아키텍처를 정리한 프로젝트 개요 문서.', '/docs/project-overview.html', 'Multi-Agent, Next.js, Case Study', '2026-06-29 12:00:00', '2026-06-29 12:00:00'),
('seed-small-vill-meta', 'Small Vill 메타연구', '"Small Vill" 개발을 위한 멀티에이전트 메타연구 보고서. 연구 방향과 분석을 정리한 문서입니다.', '/docs/small-vill-meta-research.html', 'Multi-Agent, Meta Research, Report', '2026-06-29 12:00:01', '2026-06-29 12:00:01'),
('seed-msi-documentation', 'MSI 시스템 문서', '메인스트리트 투자 인텔리전스 브리프(MSI) — 8단계 멀티에이전트 파이프라인의 구조·에이전트 역할·운영 규칙을 정리한 시스템 문서.', '/docs/msi-documentation.html', 'Multi-Agent, Pipeline, Docs', '2026-06-29 12:00:02', '2026-06-29 12:00:02');
