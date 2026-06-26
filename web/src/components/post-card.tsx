import type { PublishedPost } from "@/types/post";

function formatDate(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PostCard({ post }: { post: PublishedPost }) {
  return (
    <article className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow duration-300">
      <time
        dateTime={post.publishedAt.toISOString()}
        className="text-xs text-slate-400 mb-3 block"
      >
        {formatDate(post.publishedAt)}
      </time>
      <h3 className="font-semibold text-slate-900 mb-2 leading-snug">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      )}
    </article>
  );
}
