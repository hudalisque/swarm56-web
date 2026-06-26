import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://swarm56.com"),
  title: "Jongseok Won",
  description:
    "회사를 만들고 운영해온 경험을 바탕으로, 다시 개발자로 돌아와 기술과 비즈니스가 만나는 작업을 기록합니다.",
  openGraph: {
    title: "Jongseok Won",
    description:
      "회사를 만들고 운영해온 경험을 바탕으로, 다시 개발자로 돌아와 기술과 비즈니스가 만나는 작업을 기록합니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
