import { create } from "zustand";
import api from "@/lib/api/axios";

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  sender: User;
  type: "clap" | "comment" | "follow";
  message: string;
  story_slug?: string;
  is_read: boolean;
  created_at: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "clap" | "comment" | "follow";
  story_slug?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  toasts: ToastMessage[];
  eventSource: EventSource | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addToast: (message: string, type: Notification["type"], storySlug?: string) => void;
  removeToast: (id: string) => void;
  connectSSE: () => void;
  disconnectSSE: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  toasts: [],
  eventSource: null,

  fetchNotifications: async () => {
    try {
      const res = await api.get("/notifications");
      const notifications: Notification[] = res.data.data || [];
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        const unreadCount = notifications.filter((n) => !n.is_read).length;
        return { notifications, unreadCount };
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post("/notifications/read-all");
      set((state) => {
        const notifications = state.notifications.map((n) => ({ ...n, is_read: true }));
        return { notifications, unreadCount: 0 };
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  addToast: (message: string, type: Notification["type"], storySlug?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, story_slug: storySlug }],
    }));
    // Auto remove toast after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  connectSSE: () => {
    if (typeof window === "undefined") return;
    if (get().eventSource) return; // already connected

    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const streamURL = `${baseURL}/notifications/stream`;

    try {
      // Create EventSource with credential delegation (cookies propagation)
      const es = new EventSource(streamURL, { withCredentials: true });

      es.addEventListener("notification", (event) => {
        try {
          const data: Notification = JSON.parse(event.data);
          
          set((state) => {
            // Check if notification already exists to avoid duplicates
            if (state.notifications.some((n) => n.id === data.id)) return state;
            
            const updated = [data, ...state.notifications];
            return {
              notifications: updated,
              unreadCount: updated.filter((n) => !n.is_read).length,
            };
          });

          // Push local toast alert
          get().addToast(data.message, data.type, data.story_slug);
        } catch (e) {
          console.error("Error parsing real-time notification:", e);
        }
      });

      es.onerror = (err) => {
        console.error("SSE connection error:", err);
      };

      set({ eventSource: es });
    } catch (error) {
      console.error("Failed to establish SSE stream:", error);
    }
  },

  disconnectSSE: () => {
    const es = get().eventSource;
    if (es) {
      es.close();
      set({ eventSource: null });
    }
  },
}));
