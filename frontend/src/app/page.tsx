import Link from "next/link";
import { calculateReadingTime, getExcerpt } from "@/lib/htmlParser";
import { HeaderNav } from "@/components/HeaderNav";

// Menggunakan tipe parsial yang setara dengan response backend
interface Story {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: string;
  published_at: string;
  total_claps: number;
  author: {
    username: string;
  };
}

interface ApiResponse {
  data: Story[];
}

// Fitur Revalidasi ISR 60 detik (Sesuai Permintaan)
export const revalidate = 60;

async function fetchPublishedStories(): Promise<Story[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/stories`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) throw new Error("Failed to fetch stories");
    const json: ApiResponse = await res.json();
    return json.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function Home() {
  const stories = await fetchPublishedStories();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Topbar */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            Medium Clone
          </Link>
          <HeaderNav />
        </div>
      </header>

      {/* Main Feed Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {stories.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No published stories yet. Be the first to write!
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {stories.map((story) => {
              const readingTime = calculateReadingTime(story.content);
              const excerpt = getExcerpt(story.content, 200);
              const publishDate = new Date(story.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              return (
                <article key={story.id} className="group flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{story.author?.username}</span>
                    <span>·</span>
                    <time dateTime={story.published_at}>{publishDate}</time>
                  </div>

                  <Link href={`/story/${story.slug}`} className="cursor-pointer">
                    <h2 className="font-sans text-2xl font-bold font-extrabold group-hover:underline">
                      {story.title}
                    </h2>
                    <p className="mt-2 font-serif text-muted-foreground line-clamp-3">
                      {excerpt}
                    </p>
                  </Link>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{readingTime} min read</span>
                    {story.total_claps > 0 && (
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.2 3.2C9.4 2.4 8 2.4 7.2 3.2C6.4 4 6.4 5.4 7.2 6.2L12 11M14.2 3.2C13.4 2.4 12 2.4 11.2 3.2C10.4 4 10.4 5.4 11.2 6.2L16 11M3.2 10.2C2.4 9.4 2.4 8 3.2 7.2C4 6.4 5.4 6.4 6.2 7.2L11 12M17.2 3.2C16.4 2.4 15 2.4 14.2 3.2C13.4 4 13.4 5.4 14.2 6.2L19 11M2.2 15.2C1.4 16 1.4 17.4 2.2 18.2C3 19 4.4 19 5.2 18.2L11 12.4M12.4 11L18.2 5.2C19 4.4 20.4 4.4 21.2 5.2C22 6 22 7.4 21.2 8.2L15.4 14M14 15.4L8.2 21.2C7.4 22 6 22 5.2 21.2C4.4 20.4 4.4 19 5.2 18.2L11 12.4" /></svg>
                        {story.total_claps}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
