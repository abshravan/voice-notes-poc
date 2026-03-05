"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface StructuredMemory {
  type: "idea" | "task" | "note";
  title: string;
  content: string;
  tags: string[];
  action_items: string[];
}

export interface VoiceNoteFullResult {
  id: string;
  filename: string;
  audio_url: string;
  file_size: number;
  content_type: string;
  transcript: string | null;
  language: string | null;
  duration_seconds: number;
  memory: StructuredMemory | null;
  memory_id: string | null;
  status: string;
  created_at: string;
}

/**
 * React Query mutation: upload audio → transcribe → structure into memory.
 */
export function useUploadVoiceNote() {
  return useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const ext = audioBlob.type.includes("webm") ? "webm" : "wav";
      formData.append("file", audioBlob, `voice-note-${timestamp}.${ext}`);

      return api.upload<VoiceNoteFullResult>(
        "/api/voice-notes/upload-and-transcribe",
        formData
      );
    },
  });
}
