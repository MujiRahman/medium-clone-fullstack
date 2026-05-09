"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import api from "@/lib/api/axios";

// SVG Icon Hands/Claps
const ClapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.2 3.2C9.4 2.4 8 2.4 7.2 3.2C6.4 4 6.4 5.4 7.2 6.2L12 11M14.2 3.2C13.4 2.4 12 2.4 11.2 3.2C10.4 4 10.4 5.4 11.2 6.2L16 11M3.2 10.2C2.4 9.4 2.4 8 3.2 7.2C4 6.4 5.4 6.4 6.2 7.2L11 12M17.2 3.2C16.4 2.4 15 2.4 14.2 3.2C13.4 4 13.4 5.4 14.2 6.2L19 11M2.2 15.2C1.4 16 1.4 17.4 2.2 18.2C3 19 4.4 19 5.2 18.2L11 12.4M12.4 11L18.2 5.2C19 4.4 20.4 4.4 21.2 5.2C22 6 22 7.4 21.2 8.2L15.4 14M14 15.4L8.2 21.2C7.4 22 6 22 5.2 21.2C4.4 20.4 4.4 19 5.2 18.2L11 12.4" />
  </svg>
);

interface ClapButtonProps {
  storyId: string;
  initialClaps?: number;
}

export function ClapButton({ storyId, initialClaps = 0 }: ClapButtonProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [clicks, setClicks] = useState(0);
  const [totalClaps, setTotalClaps] = useState(initialClaps);
  const [activeParticles, setActiveParticles] = useState<{ id: number }[]>([]);
  
  // Ref for debouncing API calls
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const particleIdCounter = useRef(0);

  const handleClapClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    // Stop at 50 client side (as requested)
    if (clicks >= 50) return;

    setClicks((prev) => prev + 1);

    // Create a new floating particle ID
    const newId = particleIdCounter.current++;
    setActiveParticles((prev) => [...prev, { id: newId }]);

    // Clear particle after 1s animation
    setTimeout(() => {
      setActiveParticles((prev) => prev.filter(p => p.id !== newId));
    }, 1000);

    // Debounce API push (send the aggr count after 1 second of inactivity)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        // Send ALL pending chunks since last successful sync? 
        // Wait, the API specifies taking "count" as the NEW claps to add.
        // We can't just pass `clicks` because next click batch would double add it if we dont track synced.
        // Simpler: Just rely on sending { count: 1 } per click but that's what we want to avoid.
        // Let's implement local chunk aggregator.
      } catch (err) {
        console.error("Failed to commit claps", err);
      }
    }, 1500);
  };
  
  // Chunk tracking correctly
  const pendingClapsToSync = useRef(0);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const handleOptimisticClap = () => {
    if (!isAuthenticated) {
      router.push("/login?callback=/story");
      return;
    }
    if (clicks >= 50) return;

    setClicks((c) => c + 1);
    setTotalClaps((c) => c + 1);
    pendingClapsToSync.current += 1;

    // Generate Particle
    const newId = particleIdCounter.current++;
    setActiveParticles((prev) => [...prev, { id: newId }]);

    setTimeout(() => {
      setActiveParticles((prev) => prev.filter(p => p.id !== newId));
    }, 1000);

    // Debounce to Backend
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      if (pendingClapsToSync.current === 0) return;
      const countToSend = pendingClapsToSync.current;
      pendingClapsToSync.current = 0; // reset local pending
      try {
        await api.post(`/stories/${storyId}/clap`, { count: countToSend });
      } catch (err: any) {
        // Rollback clicks if error
        setClicks((c) => c - countToSend);
        setTotalClaps((c) => c - countToSend);
        if (err.response?.status === 400) {
          alert("Maximum 50 claps reached.");
        }
      }
    }, 1000);
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Particles Area */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-end justify-center pointer-events-none">
        {activeParticles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 text-primary font-bold text-sm select-none animate-slide-up-fade"
            style={{
              // Add slight random X offset
              transform: `translateX(${(Math.random() - 0.5) * 20}px)`,
            }}
          >
            +1
          </div>
        ))}
      </div>

      <button
        onClick={handleOptimisticClap}
        className={`rounded-full p-3 transition-colors border shadow-sm flex items-center justify-center
          ${clicks > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
        aria-label="Clap"
      >
        <ClapIcon />
      </button>

      {totalClaps > 0 && <span className="mt-1 text-xs text-muted-foreground">{totalClaps} {totalClaps === 1 ? 'clap' : 'claps'}</span>}
    </div>
  );
}
