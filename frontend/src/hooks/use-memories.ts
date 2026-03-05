"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { StructuredMemory } from "@/hooks/use-upload-voice-note";

export interface MemoryItem {
  id: string;
  type: "idea" | "task" | "note";
  title: string;
  content: string;
  tags: string[];
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
