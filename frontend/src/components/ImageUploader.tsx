"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import api from "@/lib/api/axios";

interface ImageUploaderProps {
  onUpload: (result: UploadResult) => void;
  imageType: "avatar" | "cover" | "content";
  currentImageUrl?: string;
  className?: string;
  aspectRatio?: string;
  placeholder?: string;
}

export interface UploadResult {
  url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  size_bytes: number;
}

export default function ImageUploader({
  onUpload,
  imageType,
  currentImageUrl,
  className = "",
  aspectRatio = "auto",
  placeholder = "Drag & drop image here, or click to browse",
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const compressAndUpload = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const imageCompression = (await import("browser-image-compression")).default;
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
      });

      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);

      const formData = new FormData();
      formData.append("file", compressed, compressed.name || "image.jpg");
      formData.append("type", imageType);

      const response = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });

      const result = response.data.data as UploadResult;
      setPreview(result.url);
      onUpload(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [imageType, currentImageUrl, onUpload]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    compressAndUpload(file);
  }, [compressAndUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearImage = useCallback(() => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onUpload({ url: "", thumbnail_url: "", width: 0, height: 0, size_bytes: 0 });
  }, [onUpload]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group" style={{ aspectRatio }}>
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-full object-cover rounded-lg"
          />
          {!uploading && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                title="Change image"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={clearImage}
                className="p-2 bg-white/20 hover:bg-red-500/50 rounded-full backdrop-blur-sm transition-colors"
                title="Remove image"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          }`}
          style={{ aspectRatio }}
        >
          <ImageIcon className="w-10 h-10 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            {placeholder}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            JPEG, PNG, WebP · Max 10MB
          </p>
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <div className="w-3/4 bg-white/20 rounded-full h-2">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-white">{progress}%</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
