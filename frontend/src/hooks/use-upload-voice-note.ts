"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface VoiceNoteUploadResult {
  id: string;
  filename: string;
  audio_url: string;
  file_size: number;
  content_type: string;
  status: string;
  created_at: string;
}

/**
 * React Query mutation for uploading a recorded audio blob to the backend.
 */
export function useUploadVoiceNote() {
  return useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      // Use a descriptive filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const ext = audioBlob.type.includes("webm") ? "webm" : "wav";
      formData.append("file", audioBlob, `voice-note-${timestamp}.${ext}`);

      return api.upload<VoiceNoteUploadResult>(
        "/api/voice-notes/upload",
        formData
      );
    },
  });
}
