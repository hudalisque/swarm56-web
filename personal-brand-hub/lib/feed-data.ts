import {
  GithubIcon,
  LinkedinIcon,
  YoutubeIcon,
  InstagramIcon,
  FacebookIcon,
  NaverIcon,
  NotionIcon,
  SwarmIcon,
  type IconType,
} from '@/components/brand-icons'

export type ChannelId =
  | 'naver'
  | 'notion'
  | 'youtube'
  | 'github'
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'swarm'

export interface FeedItem {
  title: string
  excerpt: string
  date: string // YYYY-MM-DD
  url: string
  thumbnail: string
}

export interface Channel {
  id: ChannelId
  name: string
  icon: IconType
  /** "더보기" — 채널/프로필 원본 링크 */
  profileUrl: string
  items: FeedItem[]
}

// 채널 메타 (아이콘·이름·프로필 URL). 실제 피드 items 는 서버(feed-repository)에서 주입.
export const channels: Channel[] = [
  { id: 'naver', name: 'Naver Blog', icon: NaverIcon, profileUrl: 'https://blog.naver.com/acepetra', items: [] },
  { id: 'notion', name: 'Notion', icon: NotionIcon, profileUrl: 'https://river-perfume-8d6.notion.site/f75cf5da3cbb4823bbe642a199a6f462', items: [] },
  { id: 'youtube', name: 'YouTube', icon: YoutubeIcon, profileUrl: 'https://www.youtube.com', items: [] },
  { id: 'github', name: 'GitHub', icon: GithubIcon, profileUrl: 'https://github.com/hudalisque', items: [] },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedinIcon, profileUrl: 'https://www.linkedin.com/in/peter-jong-suk-won-08588239', items: [] },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, profileUrl: 'https://www.instagram.com/hudalisque', items: [] },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, profileUrl: 'https://www.facebook.com/share/1GzASnaNjK/', items: [] },
  { id: 'swarm', name: 'Swarm', icon: SwarmIcon, profileUrl: 'https://www.swarmapp.com', items: [] },
]
