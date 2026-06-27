import {
  GithubIcon,
  LinkedinIcon,
  NaverIcon,
  type IconType,
} from '@/components/brand-icons'

export interface SocialLink {
  label: string
  href: string
  icon: IconType
}

export const socialLinks: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/hudalisque', icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/peter-jong-suk-won-08588239', icon: LinkedinIcon },
  { label: 'Naver Blog', href: 'https://blog.naver.com/acepetra', icon: NaverIcon },
]

export const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]
