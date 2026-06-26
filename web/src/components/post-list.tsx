import type { PublishedPost } from "@/types/post";
import { PostCard } from "@/components/post-card";
import { EmptyPosts } from "@/components/empty-posts";

export function PostList({ posts }: { posts: PublishedPost[] }) {
  if (posts.length === 0) {
    return <EmptyPosts />;
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="list"
      aria-label="최근 기록 목록"
    >
      {posts.map((post) => (
        <div key={post.id} role="listitem">
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
