// Core domain types for the Voice Memory System

export type MemoryType = "idea" | "task" | "note";

export type MemoryStatus = "pending" | "processed" | "failed";

export interface Memory {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  tags: string[];
  audio_url: string | null;
  transcript: string;
  created_at: string;
  updated_at: string;
  status: MemoryStatus;
}

export interface VoiceNote {
  id: string;
  audio_url: string;
  duration_seconds: number;
  transcript: string | null;
  memory_id: string | null;
  created_at: string;
  status: "uploading" | "transcribing" | "processing" | "done" | "error";
}

export interface SearchResult {
  memory: Memory;
  score: number;
}
