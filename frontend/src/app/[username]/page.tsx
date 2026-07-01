"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import { HeaderNav } from "@/components/HeaderNav";
import { FollowButton } from "@/components/FollowButton";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Story {
  id: string;
  slug: string;
  title: string;
  content: string;
  tldr?: string;
  published_at: string;
  total_claps: number;
}

interface ProfileUser {
  id: string;
  username: string;
  bio?: string;
  followers_count: number;
  following_count: number;
}

interface ProfileResponse {
  user: ProfileUser;
  stories: Story[];
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const { isAuthenticated, user: currentUser } = useAuthStore();
  
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);

  const isSelf = isAuthenticated && currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${username}`);
        setProfile(res.data.data);
        setNewBio(res.data.data.user.bio || "");
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      await api.put(`/users/${username}`, { bio: newBio });
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          user: {
            ...prev.user,
            bio: newBio,
          },
        };
      });
      setIsEditingBio(false);
    } catch (error) {
      console.error("Failed to update bio:", error);
    } finally {
      setIsSavingBio(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center">
        <svg className="animate-spin h-8 w-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-sans">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <Link href="/" className="mt-4 text-primary underline">Return Home</Link>
      </div>
    );
  }

  const { user, stories } = profile;

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

      {/* Profile Main Page */}
      <main className="mx-auto max-w-4xl px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Left Side: Stories List */}
        <section className="flex-1 min-w-0">
          <h2 className="font-sans text-2xl font-bold border-b border-border pb-4 mb-6">
            Stories
          </h2>

          {stories.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm italic">
              No stories published yet.
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {stories.map((story) => {
                const publishDate = new Date(story.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const excerpt = story.content.replace(/<[^>]*>/g, "").substring(0, 180);

                return (
                  <article key={story.id} className="group flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground">
                      Published on <time dateTime={story.published_at}>{publishDate}</time>
                    </div>

                    <Link href={`/story/[slug]`} as={`/story/${story.slug}`} className="cursor-pointer">
                      <h3 className="font-sans text-xl font-bold font-extrabold group-hover:underline leading-snug">
                        {story.title}
                      </h3>
                      <p className="mt-2 font-serif text-sm text-muted-foreground line-clamp-3">
                        {story.tldr || excerpt}
                      </p>
                    </Link>

                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      {story.total_claps > 0 && (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                          {story.total_claps}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Author Details Sidebar */}
        <aside className="w-full md:w-80 shrink-0 flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-border/40 bg-muted/20 backdrop-blur-sm sticky top-6">
            
            {/* User Avatar & Title */}
            <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-2xl select-none mb-4">
              {user.username.charAt(0).toUpperCase()}
            </div>
            
            <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
              {user.username}
            </h1>

            {/* Follow Counts */}
            <div className="flex gap-4 mt-2 mb-4 text-sm text-muted-foreground">
              <span><strong>{user.followers_count}</strong> Followers</span>
              <span><strong>{user.following_count}</strong> Following</span>
            </div>

            {/* Follow Toggle */}
            {!isSelf && isAuthenticated && (
              <div className="mb-4">
                <FollowButton username={user.username} />
              </div>
            )}

            {/* Bio Box */}
            <div className="border-t border-border/40 pt-4 mt-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                About
              </h3>
              
              {isEditingBio ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="w-full text-sm p-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={4}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingBio(false)}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveBio}
                      disabled={isSavingBio}
                      className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSavingBio ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {user.bio || (isSelf ? "Tell the world about yourself..." : "No bio written yet.")}
                  </p>
                  {isSelf && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-xs text-primary font-semibold hover:underline mt-2"
                    >
                      Edit bio
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </aside>
      </main>
    </div>
  );
}
