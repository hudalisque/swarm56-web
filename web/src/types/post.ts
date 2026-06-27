// 옵시디언 파생 카드 캐시(FeedCard) 뷰 타입. (파일명은 R5에서 feed.ts로 정리 예정)

export const CHANNELS = [
  "NAVER_BLOG",
  "NOTION",
  "YOUTUBE",
  "GITHUB",
  "LINKEDIN",
  "INSTAGRAM",
  "FACEBOOK",
  "SWARM",
] as const;

export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  NAVER_BLOG: "Naver Blog",
  NOTION: "Notion",
  YOUTUBE: "YouTube",
  GITHUB: "GitHub",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  SWARM: "Swarm",
};

export type FeedCardView = {
  id: string;
  channel: string;
  title: string;
  excerpt: string | null;
  thumbnailPath: string | null;
  thumbnailKind: string;
  originalUrl: string;
  publishedAt: Date;
};
