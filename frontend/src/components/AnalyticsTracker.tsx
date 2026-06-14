"use client";

import { useEffect, useRef } from "react";

interface AnalyticsTrackerProps {
  storyId: string;
}

export function AnalyticsTracker({ storyId }: AnalyticsTrackerProps) {
  const startTimeRef = useRef<number>(0);
  const detectedSourceRef = useRef<string>("Direct");

  useEffect(() => {
    // Record session start time
    startTimeRef.current = Date.now();

    // Detect referrer traffic origin
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      if (referrer) {
        if (referrer.includes("twitter.com") || referrer.includes("t.co")) {
          detectedSourceRef.current = "Twitter/X";
        } else if (referrer.includes("google.com")) {
          detectedSourceRef.current = "Google Search";
        } else if (referrer.includes(window.location.hostname)) {
          detectedSourceRef.current = "Medium Feed";
        } else {
          try {
            const url = new URL(referrer);
            detectedSourceRef.current = url.hostname.replace("www.", "");
          } catch (e) {
            detectedSourceRef.current = "Referral";
          }
        }
      }
    }

    const sendAnalyticsData = () => {
      if (startTimeRef.current === 0) return;
      
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      // Stop tracking if duration is zero or invalid
      if (elapsedSeconds < 0) return;

      const payload = JSON.stringify({
        article_id: storyId,
        source: detectedSourceRef.current,
        duration: elapsedSeconds,
      });

      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/analytics/track`;

      // Use sendBeacon for reliable unload data dispatch
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback for browsers not supporting sendBeacon
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: payload,
          keepalive: true,
        }).catch(err => console.error("Analytics tracking failed", err));
      }
      
      // Mark as sent to prevent duplicate trigger during cleanup
      startTimeRef.current = 0;
    };

    // Listener for tab closes/reloads
    window.addEventListener("beforeunload", sendAnalyticsData);
    
    // Cleanup for internal route transitions
    return () => {
      window.removeEventListener("beforeunload", sendAnalyticsData);
      sendAnalyticsData();
    };
  }, [storyId]);

  return null;
}
