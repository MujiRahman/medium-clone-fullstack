"use client";

import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";

export function HeaderNav() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration fallback untuk cegah Mismatch Server vs Client
  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      {isAuthenticated ? (
        <>
          <span className="text-sm text-muted-foreground mr-2 hidden sm:inline-block">
            Hi, {user?.username}
          </span>
          <Link href="/me/stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors mr-2 hidden sm:inline-block">
            Stats
          </Link>
          <Link href="/new-story">
            <Button className="rounded-full bg-green-600 hover:bg-green-700 text-white">Write</Button>
          </Link>
          <Button variant="ghost" onClick={() => logout()}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="rounded-full bg-black dark:bg-white text-white dark:text-black">
              Get Started
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
