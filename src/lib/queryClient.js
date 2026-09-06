import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/apiClient";

/**
 * Shared cache configuration.
 *
 * Tuned for a clinic on unreliable rural connectivity: retry transient network
 * failures, but never retry a 4xx (a validation error or an expired session
 * will fail identically every time and retrying just delays the message).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.isOffline) return failureCount < 3;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: false,
    },
  },
});

/** Query keys in one place so invalidation can never miss a consumer. */
export const qk = {
  queue: (doctorId) => ["queue", doctorId ?? "me"],
  queueMetrics: (doctorId) => ["queue", "metrics", doctorId ?? "me"],
  chart: (tokenId) => ["chart", tokenId],
  token: (tokenId) => ["token", tokenId],
  departments: (hospitalId) => ["departments", hospitalId],
  doctors: (hospitalId, dept) => ["doctors", hospitalId, dept ?? "all"],
  doctor: (id) => ["doctor", id],
  documents: (sessionId) => ["documents", sessionId],
  answers: (sessionId) => ["answers", sessionId],
  summary: (sessionId) => ["summary", sessionId],
  questions: () => ["questions"],
  adminOverview: () => ["admin", "overview"],
  adminStaff: () => ["admin", "staff"],
  adminAudit: (page) => ["admin", "audit", page],
  me: () => ["auth", "me"],
};
