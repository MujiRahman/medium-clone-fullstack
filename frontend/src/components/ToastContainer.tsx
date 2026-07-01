"use client";

import { useNotificationStore } from "@/lib/store/notificationStore";
import Link from "next/link";

export function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = null;
        let colorTheme = "";

        switch (toast.type) {
          case "clap":
            icon = (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            );
            colorTheme = "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10";
            break;
          case "comment":
            icon = (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            );
            colorTheme = "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
            break;
          case "follow":
            icon = (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            );
            colorTheme = "border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10";
            break;
        }

        const content = (
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl border ${colorTheme} shrink-0`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {toast.type} notification
              </p>
              <p className="text-sm font-medium mt-1 leading-snug text-foreground">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors pointer-events-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );

        return (
          <div
            key={toast.id}
            className="w-full pointer-events-auto border border-border/40 bg-background/85 backdrop-blur-md p-4 rounded-2xl shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in hover:scale-[1.02]"
          >
            {toast.story_slug ? (
              <Link
                href={`/story/[slug]`}
                as={`/story/${toast.story_slug}`}
                className="block hover:opacity-95 transition-opacity"
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
