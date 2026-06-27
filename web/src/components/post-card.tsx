import type { FeedCardView } from "@/types/post";

function formatDate(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 카드 전체 클릭 → 원문 외부 페이지 (사이트 내부 상세 없음)
export function PostCard({ card }: { card: FeedCardView }) {
  return (
    <a
      href={card.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-300"
    >
      <time
        dateTime={card.publishedAt.toISOString()}
        className="text-xs text-slate-400 mb-3 block"
      >
        {formatDate(card.publishedAt)}
      </time>
      <h3 className="font-semibold text-slate-900 mb-2 leading-snug">
        {card.title}
      </h3>
      {card.excerpt && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {card.excerpt}
        </p>
      )}
    </a>
  );
}
