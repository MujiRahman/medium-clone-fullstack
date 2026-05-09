"use client";

import { useState } from "react";
import api from "@/lib/api/axios";

export interface CommentType {
  id: string;
  story_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  user: {
    id: string;
    username: string;
  };
  children?: CommentType[];
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  if (seconds < 10) return "just now";
  return Math.floor(seconds) + " seconds ago";
}

export function CommentItem({ comment, storyId, onReplyAdded }: { comment: CommentType; storyId: string; onReplyAdded: () => void }) {
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChildren = comment.children && comment.children.length > 0;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setIsSubmitting(true);

    try {
      await api.post(`/stories/${storyId}/comments`, {
        body: replyBody,
        parent_id: comment.id, // Menyematkan parent ID ke komentar induk
      });
      setReplyBody("");
      setIsReplying(false);
      setShowReplies(true);
      onReplyAdded();
    } catch (error) {
      console.error("Failed to reply", error);
      alert("Failed to reply. Please check if you are logged in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex items-center gap-2">
        <div className="font-semibold text-sm">{comment.user.username}</div>
        <div className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</div>
      </div>
      <p className="text-sm">{comment.body}</p>
      
      <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-1">
        <button onClick={() => setIsReplying(!isReplying)} className="hover:text-foreground">Reply</button>
      </div>

      {isReplying && (
        <form onSubmit={handleReplySubmit} className="mt-2 flex flex-col gap-2 mb-2">
          <textarea
            className="w-full text-sm p-3 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            rows={2}
            placeholder="Add a reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsReplying(false)} className="text-xs px-3 py-1 text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-medium disabled:opacity-50">
              {isSubmitting ? "..." : "Reply"}
            </button>
          </div>
        </form>
      )}

      {hasChildren && (
        <div className="mt-1">
          <button 
            onClick={() => setShowReplies(!showReplies)} 
            className="text-blue-500 dark:text-blue-400 font-medium text-sm flex items-center gap-2 hover:bg-blue-500/10 px-3 py-1.5 rounded-full transition-colors"
          >
            {showReplies ? "⮟ Hide replies" : `⮬ View ${comment.children!.length} replies`}
          </button>
        </div>
      )}

      {/* REKURSIF: Render child item yang sama jika dibuka */}
      {showReplies && hasChildren && (
        <div className="pl-6 border-l-2 border-border/60 ml-2 mt-2 flex flex-col gap-2">
          {comment.children!.map((child) => (
            <CommentItem key={child.id} comment={child} storyId={storyId} onReplyAdded={onReplyAdded} />
          ))}
        </div>
      )}
    </div>
  );
}
