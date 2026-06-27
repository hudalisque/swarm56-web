import { ChevronRight } from 'lucide-react'
import type { Channel } from '@/lib/feed-data'
import { FeedCard } from '@/components/feed-card'

export function ChannelTile({ channel }: { channel: Channel }) {
  const items = channel.items.slice(0, 5)
  const Icon = channel.icon

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Tile header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-ink">
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
          <h3 className="text-sm font-semibold text-ink">{channel.name}</h3>
        </div>
        <a
          href={channel.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${channel.name} 더보기 (새 탭)`}
          className="inline-flex items-center gap-0.5 rounded-md text-xs font-medium text-brand transition-colors hover:text-brand/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          더보기
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      {/* Feed list */}
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1 p-2">
          {items.map((item) => (
            <FeedCard key={item.url} item={item} channelName={channel.name} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm text-muted-foreground">
            아직 수집된 글이 없습니다
          </p>
        </div>
      )}
    </article>
  )
}
