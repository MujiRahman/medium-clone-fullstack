"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { Button } from "./ui/Button";

interface AudioReaderProps {
  content: string;
}

export function AudioReader({ content }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [supported, setSupported] = useState(true);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Strip HTML utility
  const stripHtml = (html: string) => {
    if (typeof window === "undefined") return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    } else {
      setSupported(false);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // Cancel current speech if any
    synthRef.current.cancel();

    const plainText = stripHtml(content);
    if (!plainText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = rate;

    // Detect language & find voice
    const voices = synthRef.current.getVoices();
    const isIndonesian = plainText.includes("dan ") || plainText.includes("yang ") || plainText.includes("dengan ");
    const targetLang = isIndonesian ? "id-ID" : "en-US";

    const voice = voices.find(v => v.lang.startsWith(targetLang)) || 
                  voices.find(v => v.lang.startsWith("en")) || 
                  voices[0];

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    const synth = synthRef.current;
    if (isPlaying && synth) {
      synth.cancel();
      // Restart speech synthesis with updated playback rate
      setTimeout(() => {
        const plainText = stripHtml(content);
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.rate = newRate;
        const voices = synth.getVoices();
        const isIndonesian = plainText.includes("dan ") || plainText.includes("yang ") || plainText.includes("dengan ");
        const targetLang = isIndonesian ? "id-ID" : "en-US";
        const voice = voices.find(v => v.lang.startsWith(targetLang)) || voices.find(v => v.lang.startsWith("en"));
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        utteranceRef.current = utterance;
        synth.speak(utterance);
      }, 50);
    }
  };

  if (!supported) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 bg-secondary/35 dark:bg-zinc-900/35 backdrop-blur-md border border-border/80 px-4 py-2 rounded-2xl w-fit shadow-md transition-all duration-300">
      <style jsx global>{`
        @keyframes soundwave {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.3); }
        }
      `}</style>
      
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-violet-500 animate-pulse" />
        <span className="text-xs font-semibold text-muted-foreground mr-1">Audio Reader</span>
      </div>

      <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
        {!isPlaying ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePlay}
            className="h-8 px-2.5 rounded-xl hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPaused ? "Resume" : "Listen"}</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePause}
            className="h-8 px-2.5 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </Button>
        )}

        {(isPlaying || isPaused) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStop}
            className="h-8 w-8 p-0 rounded-xl hover:bg-red-500/10 text-red-500 flex items-center justify-center"
            title="Stop Reader"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </Button>
        )}
      </div>

      {/* Speed Rate Pill controls */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-0.5 border border-border/40 text-xs">
        {([1, 1.25, 1.5, 2] as const).map((r) => (
          <button
            key={r}
            onClick={() => handleRateChange(r)}
            className={`px-2 py-1 rounded-lg font-medium transition-all ${
              rate === r
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}x
          </button>
        ))}
      </div>

      {/* Soundwave Bouncing Equalizer animation */}
      {isPlaying && (
        <div className="flex items-center gap-0.5 h-4 px-1 border-l border-border/60 pl-3">
          <div className="w-0.5 h-3 bg-violet-500 rounded-full origin-bottom animate-[soundwave_0.4s_infinite_alternate]" style={{ animationDelay: "0.1s" }} />
          <div className="w-0.5 h-3 bg-violet-500 rounded-full origin-bottom animate-[soundwave_0.4s_infinite_alternate]" style={{ animationDelay: "0.3s" }} />
          <div className="w-0.5 h-3 bg-violet-500 rounded-full origin-bottom animate-[soundwave_0.4s_infinite_alternate]" style={{ animationDelay: "0.2s" }} />
          <div className="w-0.5 h-3 bg-violet-500 rounded-full origin-bottom animate-[soundwave_0.4s_infinite_alternate]" style={{ animationDelay: "0.4s" }} />
        </div>
      )}
    </div>
  );
}
