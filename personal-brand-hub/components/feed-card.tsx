import { ArrowUpRight } from 'lucide-react'
import type { FeedItem } from '@/lib/feed-data'

export function FeedCard({ item, channelName }: { item: FeedItem; channelName: string }) {
  return (
    <li>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${item.title} — ${channelName}에서 열기 (새 탭)`}
        className="group flex gap-3.5 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <img
          src={item.thumbnail || '/placeholder.svg'}
          alt=""
          width={72}
          height={72}
          className="size-[72px] shrink-0 rounded-md border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
            {item.title}
          </h4>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {item.excerpt}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <time
              dateTime={item.date}
              className="text-xs tabular-nums text-muted-foreground"
            >
              {item.date}
            </time>
            <ArrowUpRight
              className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>
        </div>
      </a>
    </li>
  )
}
