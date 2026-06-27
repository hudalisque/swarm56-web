import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://swarm56.com'),
  title: 'Jongseok Won — swarm56.com',
  description:
    '개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다. 소프트웨어, 비즈니스 인텔리전스, 업무 자동화, AI 워크플로를 실험하고 기록하는 원종석의 활동 허브.',
  keywords: [
    'Jongseok Won',
    '원종석',
    'swarm56',
    'Founder',
    'Software',
    'Business Intelligence',
    'Workflow Automation',
    'AI',
  ],
  openGraph: {
    title: 'Jongseok Won — swarm56.com',
    description:
      '소프트웨어, 비즈니스 인텔리전스, 업무 자동화, AI 워크플로를 실험하고 기록하는 원종석의 활동 허브.',
    url: 'https://swarm56.com',
    siteName: 'swarm56.com',
    locale: 'ko_KR',
    type: 'website',
  },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <head>
        <link
          rel="stylesheet"
          as="style"
          // Pretendard variable web font
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
