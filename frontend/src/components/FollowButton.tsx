"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "./ui/Button";

interface FollowButtonProps {
  username: string;
}

export function FollowButton({ username }: FollowButtonProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || user.username === username) {
      setIsLoading(false);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const res = await api.get(`/users/${username}/follow-status`);
        setIsFollowing(res.data.data.following);
      } catch (error) {
        console.error("Failed to check follow status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [username, isAuthenticated, user]);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await api.post(`/users/${username}/unfollow`);
        setIsFollowing(false);
      } else {
        await api.post(`/users/${username}/follow`);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || user?.username === username) return null;

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" className="rounded-full h-8 px-4 w-24" disabled>
        <span className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleFollowToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`rounded-full h-8 px-4 w-24 font-medium transition-all duration-200 ${
          isHovered
            ? "border-red-500 text-red-500 bg-red-500/5 hover:bg-red-500/10"
            : "border-border text-muted-foreground bg-transparent"
        }`}
      >
        {isHovered ? "Unfollow" : "Following"}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleFollowToggle}
      className="rounded-full h-8 px-4 w-24 bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200"
    >
      Follow
    </Button>
  );
}
