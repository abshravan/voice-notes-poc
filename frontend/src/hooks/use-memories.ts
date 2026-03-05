"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface MemoryItem {
  id: string;
  type: "idea" | "task" | "note";
  title: string;
  content: string;
  tags: string[];
  action_items: string[];
  audio_url: string | null;
  transcript: string;
  created_at: string;
  updated_at: string;
  status: string;
}

/**
 * Fetch all persisted memories, optionally filtered by type.
 */
export function useMemories(type?: string) {
  const params = type ? `?type=${type}` : "";
  return useQuery({
    queryKey: ["memories", type ?? "all"],
    queryFn: () => api.get<MemoryItem[]>(`/api/memories${params}`),
  });
}

/**
 * Fetch a single memory by ID.
 */
export function useMemory(id: string) {
  return useQuery({
    queryKey: ["memory", id],
    queryFn: () => api.get<MemoryItem>(`/api/memories/${id}`),
    enabled: !!id,
  });
}

/**
 * Delete a memory and invalidate the list cache.
 */
export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/memories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}
