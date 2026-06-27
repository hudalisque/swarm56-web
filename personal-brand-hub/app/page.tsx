import { SiteHeader } from '@/components/site-header'
import { HeroSection } from '@/components/hero-section'
import { SocialHub } from '@/components/social-hub'
import { AboutSection } from '@/components/about-section'
import { ProjectsSection } from '@/components/projects-section'
import { ContactSection } from '@/components/contact-section'
import { SiteFooter } from '@/components/site-footer'
import { getItemsByChannel } from '@/lib/feed-repository'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const itemsByChannel = await getItemsByChannel()
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <HeroSection />
        <SocialHub itemsByChannel={itemsByChannel} />
        <AboutSection />
        <ProjectsSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  )
}
