"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import { CommentType, CommentItem } from "./CommentItem";

function countComments(comments: CommentType[]): number {
  return comments.reduce((acc, c) => acc + 1 + (c.children ? countComments(c.children) : 0), 0);
}

export function ThreadedComments({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/stories/${storyId}/comments`);
      setComments(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [storyId]);

  const handleMainCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/stories/${storyId}/comments`, {
        body: newCommentBody,
      });
      setNewCommentBody("");
      fetchComments();
    } catch (error) {
      console.error("Failed to post comment", error);
      alert("Failed to post comment. Please check if you are logged in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-sm font-medium text-muted-foreground py-8 text-center w-full">Loading discussions...</div>;

  const totalComments = countComments(comments);

  return (
    <div className="mt-10 max-w-3xl mx-auto w-full px-4 border-t border-border pt-10">
      <h3 className="font-sans text-xl font-bold mb-6">Responses ({totalComments})</h3>
      
      <form onSubmit={handleMainCommentSubmit} className="mb-10 sm:rounded-xl shadow-sm border border-border p-4 bg-background">
        <textarea
          className="w-full text-sm resize-none bg-transparent focus:outline-none"
          rows={3}
          placeholder="What are your thoughts?"
          value={newCommentBody}
          onChange={(e) => setNewCommentBody(e.target.value)}
          required
        />
        <div className="flex justify-end mt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Responding..." : "Respond"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-6 pb-20">
        {comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 font-serif">No responses yet. Be the first to share your thoughts!</div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} storyId={storyId} onReplyAdded={fetchComments} />
          ))
        )}
      </div>
    </div>
  );
}
