"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import api from "@/lib/api/axios";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import { useAuthStore } from "@/lib/store/authStore";
import { FollowButton } from "@/components/FollowButton";

interface Story {
  id: string;
  slug: string;
  title: string;
  content: string;
  tldr?: string;
  tags?: string;
  published_at: string;
  total_claps: number;
  author: {
    username: string;
    bio?: string;
  };
}

interface User {
  id: string;
  username: string;
  bio?: string;
}

interface SearchResponse {
  stories: Story[];
  users: User[];
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"stories" | "users">("stories");
  const { isAuthenticated, user: currentUser } = useAuthStore();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search/autocomplete?q=${encodeURIComponent(query)}`);
        setResults(res.data.data);
      } catch (error) {
        console.error("Search query failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            Medium Clone
          </Link>
          <HeaderNav />
        </div>
      </header>

      {/* Main Search Layout */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Search Title & Input */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-3xl font-bold bg-transparent border-b border-border focus:border-foreground focus:outline-none pb-2 transition-colors placeholder-muted-foreground/60"
            />
          </form>

          {/* Results Info and Tabs */}
          {results && (
            <div className="flex border-b border-border mt-4">
              <button
                onClick={() => setActiveTab("stories")}
                className={`py-3 px-4 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                  activeTab === "stories"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Stories ({results.stories.length})
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`py-3 px-4 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                  activeTab === "users"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                People ({results.users.length})
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <svg className="animate-spin h-8 w-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : results ? (
          <div>
            {/* STORIES TAB */}
            {activeTab === "stories" && (
              <div className="flex flex-col gap-8">
                {results.stories.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No articles matching your search.
                  </div>
                ) : (
                  results.stories.map((story) => {
                    const publishDate = new Date(story.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <article key={story.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Link href={`/[username]`} as={`/${story.author.username}`} className="font-semibold text-foreground hover:underline">
                            {story.author.username}
                          </Link>
                          <span>·</span>
                          <time>{publishDate}</time>
                        </div>

                        <Link href={`/story/[slug]`} as={`/story/${story.slug}`}>
                          <h2 className="text-xl font-bold hover:underline mb-1">
                            {story.title}
                          </h2>
                          <p className="text-sm font-serif text-muted-foreground line-clamp-3">
                            {story.tldr || story.content.replace(/<[^>]*>/g, "").substring(0, 180)}...
                          </p>
                        </Link>

                        {story.tags && (
                          <div className="flex gap-1.5 mt-1">
                            {story.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0).map((tag, idx) => (
                              <span key={idx} className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* PEOPLE TAB */}
            {activeTab === "users" && (
              <div className="flex flex-col gap-6">
                {results.users.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No people matching your search.
                  </div>
                ) : (
                  results.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/40 hover:bg-muted/10 transition-colors">
                      <Link href={`/[username]`} as={`/${user.username}`} className="flex items-center gap-4 flex-1 mr-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg select-none">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground hover:underline">{user.username}</h3>
                          {user.bio ? (
                            <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">{user.bio}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 italic mt-0.5">No bio written yet</p>
                          )}
                        </div>
                      </Link>

                      {isAuthenticated && currentUser?.id !== user.id && (
                        <FollowButton username={user.username} />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            Type at least 2 characters to search articles and people.
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex justify-center items-center">
        <svg className="animate-spin h-8 w-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
