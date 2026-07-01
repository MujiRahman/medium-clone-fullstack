import type { Metadata } from 'next';
import Link from 'next/link';
import { calculateReadingTime, getExcerpt } from '@/lib/htmlParser';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ClapButton } from '@/components/ClapButton';
import { ThreadedComments } from "@/components/ThreadedComments";
import { AudioReader } from '@/components/AudioReader';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { FollowButton } from '@/components/FollowButton';

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

interface PageProps {
  params: { slug: string };
}

// ISR Configuration (60 seconds caching cycle)
export const revalidate = 60;

// Fetch function
async function getStory(slug: string): Promise<Story | null> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/stories/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    return null;
  }
}

// 1. Dynamic Metadata & SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const story = await getStory(params.slug);
  
  if (!story) {
    return { title: 'Story Not Found' };
  }

  const excerpt = getExcerpt(story.content, 160);

  return {
    title: `${story.title} - Medium Clone`,
    description: excerpt,
    openGraph: {
      title: story.title,
      description: excerpt,
      type: 'article',
      authors: [story.author.username],
    },
  };
}

// 2. Server Component Page Render
export default async function StoryPage({ params }: PageProps) {
  const story = await getStory(params.slug);

  if (!story) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="text-center">
          <h1 className="text-2xl font-bold">404 - Article Not Found</h1>
          <Link href="/" className="mt-4 inline-block text-primary underline">Return Home</Link>
        </div>
      </div>
    );
  }

  const readingTime = calculateReadingTime(story.content);
  const publishDate = new Date(story.published_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  // 3. JSON-LD Schema.org Injector for SEO Google Bots
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    datePublished: story.published_at,
    author: [
      {
        '@type': 'Person',
        name: story.author.username,
      }
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Injecting JSON-LD into DOM */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            Medium Clone
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/new-story" className="text-sm font-medium hover:underline text-muted-foreground mr-4">
              Write
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-12 pb-24">
        <AnalyticsTracker storyId={story.id} />
        {/* Story Meta Header */}
        <header className="mb-10">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6">
            {story.title}
          </h1>
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar Placeholder */}
            <Link href={`/[username]`} as={`/${story.author.username}`}>
              <div className="h-12 w-12 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center font-bold text-muted-foreground cursor-pointer">
                {story.author.username.charAt(0).toUpperCase()}
              </div>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Link href={`/[username]`} as={`/${story.author.username}`} className="font-semibold text-foreground hover:underline">
                  {story.author.username}
                </Link>
                <FollowButton username={story.author.username} />
              </div>
              <span className="text-sm text-muted-foreground mt-0.5">
                {readingTime} min read · {publishDate}
              </span>
            </div>
          </div>
          <AudioReader content={story.content} />
        </header>

        {/* Story Body Canvas */}
        <article 
           className="prose prose-lg dark:prose-invert font-serif w-full max-w-none prose-headings:font-sans"
           dangerouslySetInnerHTML={{ __html: story.content }}
        />
        
        <div className="mt-16 flex items-center gap-8 py-4 border-t border-border">
           <ClapButton storyId={story.id} initialClaps={story.total_claps} />
        </div>

        <ThreadedComments storyId={story.id} />
      </main>
    </div>
  );
}
