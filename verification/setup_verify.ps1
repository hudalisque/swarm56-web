# verification/setup_verify.ps1
# 목적: Codex가 "막혀서 못 한 검증"(백오피스 런타임·토큰채널·LLM)을 실행할 수 있게
#       런타임 환경을 구성한다. 이 스크립트는 *환경 구성만* 한다 — 검증/판정은 Codex가 한다.
# 실행: homepage_project 루트에서
#       powershell -ExecutionPolicy Bypass -File verification\setup_verify.ps1
$ErrorActionPreference = "Stop"
$root  = (Resolve-Path "$PSScriptRoot\..").Path
$web   = Join-Path $root "personal-brand-hub"
$vault = Join-Path $root ".local-data\vault_verify"

# (선택) 토큰/LLM키 주입: verification\agent.env 를 만들고(agent.env.example 참고) 아래 줄의 주석을 풀면
# Notion/Swarm/Instagram/LLM 발췌까지 포함해 데이터가 생성된다. 없으면 토큰 없는 채널만.
$agentEnv = Join-Path $PSScriptRoot "agent.env"
if (Test-Path $agentEnv) {
  Get-Content $agentEnv | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.+)$') { [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim()) }
  }
  Write-Host "[env] agent.env 로드됨 (토큰/LLM 포함)"
}

Write-Host "[1/4] 클리퍼 실행 → 볼트 + dev.db 데이터 생성"
$env:PYTHONIOENCODING = "utf-8"
$env:SWARM56_VAULT_DIR = $vault
Push-Location $root
python -m agent.main
Pop-Location

Write-Host "[2/4] web dev.db 마이그레이션"
Push-Location $web
$env:DATABASE_URL = "file:./dev.db"
npx prisma generate | Out-Null
npx prisma migrate deploy

Write-Host "[3/4] 테스트 admin 비번 해시 + 세션 시크릿 생성 (비번: verify1234)"
$hash   = node -e "console.log(require('bcryptjs').hashSync('verify1234',10))"
$secret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Next(@next/env=dotenv-expand)가 .env 값의 $를 변수확장으로 처리 → bcrypt 해시($2b$10$...)가 깨짐.
# $를 \$로 이스케이프해 기록하면 런타임엔 원래 해시로 복원됨.
$hashEscaped = $hash.Replace('$', '\$')

Write-Host "[4/4] personal-brand-hub\.env 작성"
$lines = @(
  "DATABASE_URL=file:./dev.db",
  "ADMIN_PASSWORD_HASH=$hashEscaped",
  "SESSION_SECRET=$secret",
  "SWARM56_VAULT_DIR=$vault",
  "SWARM56_CLIP_TRIGGER=$root\.local-data\triggers\clip.now",
  "SWARM56_FORCE_TRIGGER=$root\.local-data\triggers\force.now"
)
Set-Content -Path ".env" -Value $lines -Encoding utf8
Pop-Location

Write-Host ""
Write-Host "=== 환경 구성 완료 — 이제 Codex가 검증 ==="
Write-Host "백오피스 런타임:  cd personal-brand-hub; npm install; npm run dev"
Write-Host "  로그인:   http://localhost:3000/admin/login   (비번: verify1234)"
Write-Host "  검증:     /admin 에서 삭제(확인)->suppressed 목록->복원, 편집, SyncRun, 감사로그(who/when/target)"
Write-Host "홈피:       http://localhost:3000/   (카드 그리드)"
Write-Host "주의: 로컬 http 에선 /vault 이미지가 404 (프로덕션 Nginx alias가 서빙). 경로 자체는 카드 src로 확인 가능."
