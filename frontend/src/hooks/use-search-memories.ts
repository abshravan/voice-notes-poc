"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface SearchResultMemory {
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

export interface SearchResult {
  memory: SearchResultMemory;
  score: number;
}

/**
 * React Query mutation for semantic search across memories.
 */
export function useSearchMemories() {
  return useMutation({
    mutationFn: async (query: string) => {
      return api.post<SearchResult[]>("/api/memories/search", {
        query,
        limit: 20,
      });
    },
  });
}
