'use client'

import { useMemo, useState } from 'react'
import { channels, type ChannelId, type FeedItem } from '@/lib/feed-data'
import { ChannelTile } from '@/components/channel-tile'

type Filter = 'all' | ChannelId

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...channels.map((c) => ({ id: c.id as Filter, label: c.name })),
]

export function SocialHub({
  itemsByChannel,
}: {
  itemsByChannel?: Record<ChannelId, FeedItem[]>
}) {
  const [active, setActive] = useState<Filter>('all')

  const merged = useMemo(
    () =>
      channels.map((c) => ({ ...c, items: itemsByChannel?.[c.id] ?? c.items })),
    [itemsByChannel],
  )
  const visibleChannels = useMemo(
    () => (active === 'all' ? merged : merged.filter((c) => c.id === active)),
    [active, merged],
  )

  return (
    <section
      id="hub"
      aria-labelledby="hub-heading"
      className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-12 md:py-16"
    >
      <div className="mb-6 md:mb-8">
        <h2
          id="hub-heading"
          className="text-2xl font-bold tracking-tight text-ink md:text-3xl"
        >
          Social Hub
        </h2>
        <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          8개 채널에 흩어진 글과 활동을 한곳에 모았습니다. 채널을 선택해 원하는
          피드만 골라 보세요. 모든 카드는 원본 글로 연결됩니다.
        </p>
      </div>

      {/* Channel filter bar */}
      <div
        role="group"
        aria-label="채널 필터"
        className="mb-7 flex flex-wrap gap-2"
      >
        {filters.map((f) => {
          const isActive = active === f.id
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(f.id)}
              className={[
                'inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isActive
                  ? 'border-ink bg-ink text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-ink/30 hover:text-ink',
              ].join(' ')}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Channel tiles grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleChannels.map((channel) => (
          <ChannelTile key={channel.id} channel={channel} />
        ))}
      </div>
    </section>
  )
}
