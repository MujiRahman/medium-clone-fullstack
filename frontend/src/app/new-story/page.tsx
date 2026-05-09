"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import api from "@/lib/api/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/Button";

type SaveStatus = "Saved to drafts" | "Saving..." | "Failed to save";

export default function NewStoryPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // States
  const [title, setTitle] = useState("");
  const [storyId, setStoryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // TipTap setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Tell your story...",
      }),
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: () => {
      setSaveStatus("Saving...");
    },
    editorProps: {
      attributes: {
        // Tailwind prose styles injected ensuring Serif aesthetics
        class: "prose prose-lg dark:prose-invert font-serif min-h-[300px] w-full max-w-none focus:outline-none",
      },
    },
  });

  // Client guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login"); // fallback non-intrusif
    }
  }, [isAuthenticated, router]);

  // Debounced values
  const debouncedTitle = useDebounce(title, 2000);
  const editorContentHtml = editor?.getHTML() || "";
  const debouncedContent = useDebounce(editorContentHtml, 2000);
  
  // Track previous to prevent firing immediately on mount if empty
  const prevDebouncedTitle = useRef(debouncedTitle);
  const prevDebouncedContent = useRef(debouncedContent);

  useEffect(() => {
    // Determine if an actual change occurred post mount
    const titleChanged = prevDebouncedTitle.current !== debouncedTitle;
    const contentChanged = prevDebouncedContent.current !== debouncedContent;

    if (!titleChanged && !contentChanged) return;
    if (debouncedTitle.trim() === "" && editor?.getText().trim() === "") return;

    prevDebouncedTitle.current = debouncedTitle;
    prevDebouncedContent.current = debouncedContent;

    const autoSave = async () => {
      setSaveStatus("Saving...");
      try {
        if (!storyId) {
          // CREATE DRAFT
          const reqBody = {
            title: debouncedTitle || "Untitled Story",
            content: debouncedContent,
          };
          const res = await api.post("/stories", reqBody);
          setStoryId(res.data.data.id);
        } else {
          // UPDATE DRAFT
          const reqBody = {
            title: debouncedTitle || "Untitled Story",
            content: debouncedContent,
          };
          await api.put(`/stories/${storyId}`, reqBody);
        }
        setSaveStatus("Saved to drafts");
      } catch (error) {
        setSaveStatus("Failed to save");
      }
    };

    autoSave();
  }, [debouncedTitle, debouncedContent, storyId, editor]);

  // Form handling (Title typing causes "Saving...")
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    setSaveStatus("Saving...");
    
    // Auto resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handlePublish = async () => {
    if (!storyId) {
      alert("Let it save to draft first.");
      return;
    }
    
    setIsPublishing(true);
    try {
      const htm = editor?.getHTML() || "";
      await api.put(`/stories/${storyId}`, {
        title: title || "Untitled Story",
        content: htm,
        status: "published",
      });
      // Sukses
      router.push("/");
    } catch (err) {
      alert("Failed to publish");
      setIsPublishing(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading editor...</div>; 
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar / Header Float */}
      <nav className="flex items-center justify-between px-6 py-4 mx-auto max-w-5xl">
        <div className="flex items-center gap-4">
          <span className="font-serif font-bold text-xl cursor-default text-primary">Medium Clone</span>
          {saveStatus && (
            <span className="text-xs text-muted-foreground transition-opacity">
              {saveStatus}
            </span>
          )}
        </div>
        <div>
          <Button 
            onClick={handlePublish} 
            disabled={isPublishing || saveStatus === "Saving..." || (title.trim() === "" && editor?.getText().trim() === "")}
            className="rounded-full bg-green-600 hover:bg-green-700 text-white px-5"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </nav>

      {/* Editor Main Canvas */}
      <main className="mx-auto max-w-3xl mt-12 px-6 pb-20">
        {/* Title input */}
        <textarea
          autoFocus
          value={title}
          onChange={handleTitleChange}
          placeholder="Title"
          className="w-full resize-none font-sans text-5xl font-bold bg-transparent text-foreground placeholder-muted-foreground focus:outline-none mb-6 overflow-hidden"
          rows={1}
        />
        
        {/* TipTap Rich Text */}
        <EditorContent editor={editor} />
      </main>
    </div>
  );
}
