"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import Link from "next/link";

interface Story {
  id: string;
  slug: string;
  title: string;
  author: {
    username: string;
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

export function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search/autocomplete?q=${encodeURIComponent(query)}`);
        setResults(res.data.data);
      } catch (error) {
        console.error("Autocomplete search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit}>
        <div className="relative flex items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Search Medium..."
            className="w-full h-9 pl-9 pr-4 rounded-full bg-muted dark:bg-zinc-800 text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background border border-transparent focus:border-border transition-all duration-200"
          />
          <span className="absolute left-3 text-muted-foreground pointer-events-none">
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </span>
        </div>
      </form>

      {/* Autocomplete Suggestions Panel */}
      {isOpen && results && (query.trim().length >= 2) && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border/40 bg-background/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden divide-y divide-border/20 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Authors (Users) section */}
          {results.users.length > 0 && (
            <div className="p-3">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                People
              </h4>
              <div className="flex flex-col gap-1">
                {results.users.slice(0, 3).map((user) => (
                  <Link
                    key={user.id}
                    href={`/[username]`}
                    as={`/${user.username}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs select-none">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground leading-none">{user.username}</p>
                      {user.bio && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.bio}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stories (Articles) section */}
          {results.stories.length > 0 && (
            <div className="p-3">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Articles
              </h4>
              <div className="flex flex-col gap-1">
                {results.stories.slice(0, 4).map((story) => (
                  <Link
                    key={story.id}
                    href={`/story/[slug]`}
                    as={`/story/${story.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col p-2 rounded-xl hover:bg-muted/40 transition-colors text-left"
                  >
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {story.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      by {story.author.username}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {results.users.length === 0 && results.stories.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground select-none">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* View All / Submit Link */}
          {(results.users.length > 0 || results.stories.length > 0) && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={() => setIsOpen(false)}
              className="block py-2.5 text-center text-xs font-semibold text-primary bg-muted/20 hover:bg-muted/40 transition-all border-t border-border/10"
            >
              Search all results for &ldquo;{query}&rdquo;
            </Link>
          )}

        </div>
      )}
    </div>
  );
}
