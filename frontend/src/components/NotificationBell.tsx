"use client";

import { useNotificationStore } from "@/lib/store/notificationStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function NotificationBell() {
  const { isAuthenticated, user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    connectSSE,
    disconnectSSE,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Connect SSE and load notifications on login
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      connectSSE();
    } else {
      disconnectSSE();
    }
    return () => {
      disconnectSSE();
    };
  }, [isAuthenticated, user, fetchNotifications, connectSSE, disconnectSSE]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 max-h-[480px] overflow-hidden rounded-2xl border border-border/40 bg-background/95 backdrop-blur-md shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:underline transition-all"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-border/20 max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>No notifications yet</span>
              </div>
            ) : (
              notifications.map((notif) => {
                let badge = "";
                let icon = null;

                switch (notif.type) {
                  case "clap":
                    badge = "bg-blue-500/10 text-blue-500 border border-blue-500/20";
                    icon = (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                    );
                    break;
                  case "comment":
                    badge = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                    icon = (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    );
                    break;
                  case "follow":
                    badge = "bg-violet-500/10 text-violet-500 border border-violet-500/20";
                    icon = (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    );
                    break;
                }

                const timeStr = new Date(notif.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const itemContent = (
                  <div className={`p-4 flex gap-3 transition-colors duration-150 relative ${!notif.is_read ? "bg-muted/40" : "hover:bg-muted/20"}`}>
                    {!notif.is_read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
                    )}

                    <div className="relative shrink-0 select-none">
                      <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-foreground">
                        {notif.sender?.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 p-1 rounded-full ${badge}`}>
                        {icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-normal">
                        {notif.message}
                      </p>
                      <time className="text-[11px] text-muted-foreground mt-1 block">
                        {timeStr}
                      </time>
                    </div>
                  </div>
                );

                return (
                  <div key={notif.id} onClick={() => handleNotificationClick(notif.id, notif.is_read)}>
                    {notif.story_slug ? (
                      <Link href={`/story/[slug]`} as={`/story/${notif.story_slug}`} className="block">
                        {itemContent}
                      </Link>
                    ) : (
                      <Link href={`/[username]`} as={`/${notif.sender?.username}`} className="block">
                        {itemContent}
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
