"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import api from "@/lib/api/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/Button";
import { 
  Sparkles, 
  Check, 
  ArrowLeft, 
  X, 
  RefreshCw, 
  ChevronRight, 
  Plus, 
  FileText, 
  Languages, 
  Minimize2, 
  Maximize2 
} from "lucide-react";

type SaveStatus = "Saved to drafts" | "Saving..." | "Failed to save";

export default function NewStoryPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // States
  const [title, setTitle] = useState("");
  const [storyId, setStoryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // AI Assistant States
  const [aiMode, setAiMode] = useState<"menu" | "prompt" | "generating" | "preview">("menu");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [cachedSelection, setCachedSelection] = useState({ text: "", from: 0, to: 0 });
  const [lastAction, setLastAction] = useState({ action: "", customPrompt: "" });

  // Publish Modal & metadata states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [storyTldr, setStoryTldr] = useState("");
  const [storyTags, setStoryTags] = useState("");
  const [isGeneratingTldr, setIsGeneratingTldr] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiTagsRecommendation, setAiTagsRecommendation] = useState<string[]>([]);

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

  // AI Assistant Action Handlers
  const handleAiAction = async (action: string, customPromptText?: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");
    
    // Save selection context
    setCachedSelection({ text, from, to });
    setLastAction({ action, customPrompt: customPromptText || "" });
    setAiError("");
    setAiMode("generating");

    try {
      const res = await api.post("/ai/generate", {
        text,
        action,
        custom_prompt: customPromptText,
      });

      if (res.data && res.data.data && res.data.data.result) {
        setAiResult(res.data.data.result);
        setAiMode("preview");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.response?.data?.message || err.message || "Failed to generate text");
      setAiMode("preview");
    }
  };

  const handleRetry = () => {
    handleAiAction(lastAction.action, lastAction.customPrompt);
  };

  const handleReplace = () => {
    if (!editor) return;
    editor.chain().focus().insertContentAt(
      { from: cachedSelection.from, to: cachedSelection.to },
      aiResult
    ).run();
    handleDiscard();
  };

  const handleInsertBelow = () => {
    if (!editor) return;
    editor.chain().focus().insertContentAt(
      cachedSelection.to,
      `<p>${aiResult}</p>`
    ).run();
    handleDiscard();
  };

  const handleDiscard = () => {
    setAiMode("menu");
    setAiPrompt("");
    setAiResult("");
    setAiError("");
  };

  // Reset AI states when selection becomes empty
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { empty } = editor.state.selection;
      if (empty && aiMode === "menu") {
        setAiPrompt("");
        setAiResult("");
        setAiError("");
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, aiMode]);

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

  const handleGenerateAiMetadata = async () => {
    if (!editor) return;
    
    const editorText = editor.getText();
    if (editorText.trim() === "") {
      alert("Please write some content first.");
      return;
    }

    setIsGeneratingTldr(true);
    setIsGeneratingTags(true);
    setAiTagsRecommendation([]);

    // Call TLDR
    const tldrPromise = api.post("/ai/generate", {
      text: editorText,
      action: "tldr",
    }).then(res => {
      if (res.data && res.data.data && res.data.data.result) {
        setStoryTldr(res.data.data.result);
      }
      setIsGeneratingTldr(false);
    }).catch(err => {
      console.error(err);
      setIsGeneratingTldr(false);
    });

    // Call Tags
    const tagsPromise = api.post("/ai/generate", {
      text: editorText,
      action: "tags",
    }).then(res => {
      if (res.data && res.data.data && res.data.data.result) {
        const rawTags = res.data.data.result as string;
        setStoryTags(rawTags);
        const splitTags = rawTags.split(",").map(t => t.trim()).filter(t => t.length > 0);
        setAiTagsRecommendation(splitTags);
      }
      setIsGeneratingTags(false);
    }).catch(err => {
      console.error(err);
      setIsGeneratingTags(false);
    });

    await Promise.all([tldrPromise, tagsPromise]);
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
        tldr: storyTldr,
        tags: storyTags,
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
            onClick={() => setIsPublishModalOpen(true)} 
            disabled={isPublishing || saveStatus === "Saving..." || (title.trim() === "" && editor?.getText().trim() === "")}
            className="rounded-full bg-green-600 hover:bg-green-700 text-white px-5"
          >
            Publish
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
        {editor && (
          <BubbleMenu
            editor={editor}
            options={{ 
              placement: "top-start",
            }}
            shouldShow={({ editor }: { editor: any }) => {
              if (aiMode !== "menu") return true;
              return !editor.state.selection.empty;
            }}
          >
            <div className="bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-2 w-80 text-foreground transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              {aiMode === "menu" && (
                <div className="flex flex-col gap-1">
                  <div className="px-2 py-1.5 flex items-center justify-between border-b border-border/40 pb-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" /> AI Writer Assistant
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setAiMode("prompt")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold transition-all group"
                  >
                    <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                    <span>Ask AI to edit...</span>
                  </button>
                  
                  <div className="h-px bg-border/40 my-1" />
                  
                  <button
                    onClick={() => handleAiAction("fix-grammar")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-secondary text-foreground transition-all"
                  >
                    <Languages className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Fix Grammar</span>
                  </button>
                  
                  <button
                    onClick={() => handleAiAction("shorten")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-secondary text-foreground transition-all"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Shorten Sentence</span>
                  </button>
                  
                  <button
                    onClick={() => handleAiAction("extend")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-secondary text-foreground transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Expand / Elaborate</span>
                  </button>
                  
                  <button
                    onClick={() => handleAiAction("continue")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-secondary text-foreground transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Continue Writing</span>
                  </button>
                </div>
              )}

              {aiMode === "prompt" && (
                <div className="flex flex-col gap-2 p-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAiMode("menu")}
                      className="p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-muted-foreground">Ask AI</span>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (aiPrompt.trim()) handleAiAction("custom", aiPrompt);
                    }}
                    className="flex items-center gap-2 bg-secondary/50 rounded-xl p-1 border border-border"
                  >
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. rewrite in a friendly tone..."
                      className="flex-1 bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground text-foreground"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!aiPrompt.trim()}
                      className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {aiMode === "generating" && (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-ping" />
                    <Sparkles className="w-8 h-8 text-violet-500 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium animate-pulse text-foreground">AI is writing...</span>
                    <span className="text-xs text-muted-foreground">Processing your draft with Gemini</span>
                  </div>
                  <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-violet-600 rounded-full animate-pulse w-full" />
                  </div>
                </div>
              )}

              {aiMode === "preview" && (
                <div className="flex flex-col gap-3 max-h-80">
                  <div className="px-1 flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" /> AI Suggestion
                    </span>
                    <button
                      onClick={handleDiscard}
                      className="p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {aiError ? (
                    <div className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 max-h-40 overflow-y-auto">
                      {aiError}
                    </div>
                  ) : (
                    <div className="text-xs bg-secondary/30 border border-border p-2.5 rounded-lg overflow-y-auto max-h-40 font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap select-all">
                      {aiResult}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 justify-end border-t border-border/40 pt-2">
                    {aiError ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetry}
                        className="text-xs flex items-center gap-1 h-8 px-2.5"
                      >
                        <RefreshCw className="w-3 h-3" /> Try Again
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRetry}
                          className="text-xs flex items-center gap-1 h-8 px-2.5"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleInsertBelow}
                          className="text-xs flex items-center gap-1 h-8 px-2.5"
                        >
                          <Plus className="w-3 h-3" /> Insert Below
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleReplace}
                          className="text-xs bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1 h-8 px-2.5"
                        >
                          <Check className="w-3 h-3" /> Replace
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
      </main>

      {/* Interactive AI Publish Preview Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-background/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-background/95 dark:bg-zinc-900/95 border border-border/80 shadow-2xl rounded-3xl p-6 max-w-lg w-full flex flex-col gap-4 text-foreground scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" /> Story Preview Metadata
              </h2>
              <button 
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Before publishing, refine how your story appears in feeds. Use AI to generate a quick TL;DR and tags.
            </p>

            <button
              type="button"
              onClick={handleGenerateAiMetadata}
              disabled={isGeneratingTldr || isGeneratingTags}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:opacity-90 text-white disabled:opacity-50 transition-all shadow-md hover:shadow-violet-500/20"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              {isGeneratingTldr || isGeneratingTags ? "AI is generating preview metadata..." : "Auto-Generate TL;DR & Tags with AI"}
            </button>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                TL;DR Summary (displayed on feed)
              </label>
              <div className="relative">
                <textarea
                  value={storyTldr}
                  onChange={(e) => setStoryTldr(e.target.value)}
                  placeholder="Enter a 1-paragraph summary, or use AI above to auto-generate..."
                  rows={4}
                  className="w-full bg-secondary/35 border border-border/80 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl p-3 text-sm outline-none resize-none placeholder:text-muted-foreground transition-all font-serif"
                />
                {isGeneratingTldr && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <RefreshCw className="w-6 h-6 text-violet-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tags (comma-separated list)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={storyTags}
                  onChange={(e) => setStoryTags(e.target.value)}
                  placeholder="e.g. Technology, AI, Development"
                  className="w-full bg-secondary/35 border border-border/80 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground transition-all"
                />
                {isGeneratingTags && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <RefreshCw className="w-5 h-5 text-violet-500 animate-spin" />
                  </div>
                )}
              </div>
              
              {/* Display tags preview pills */}
              {storyTags && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {storyTags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0).map((tag, i) => (
                    <span key={i} className="text-xs font-medium bg-secondary/80 text-foreground px-2.5 py-1 rounded-full border border-border animate-in fade-in duration-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4 mt-2">
              <Button
                variant="outline"
                onClick={() => setIsPublishModalOpen(false)}
                className="rounded-full px-5 hover:bg-secondary border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || isGeneratingTldr || isGeneratingTags || (title.trim() === "" && editor?.getText().trim() === "")}
                className="rounded-full bg-green-600 hover:bg-green-700 text-white px-6 shadow-md hover:shadow-green-500/10"
              >
                {isPublishing ? "Publishing..." : "Confirm & Publish Now"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
