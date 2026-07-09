/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // 카드 추가 업로드(HTML+MD 각 4MB) 수용 — 기본 1MB로는 부족
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
