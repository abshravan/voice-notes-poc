"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

export interface VoiceNoteFullResult {
  id: string;
  filename: string;
  audio_url: string;
  file_size: number;
  content_type: string;
  transcript: string | null;
  language: string | null;
  duration_seconds: number;
  status: string;
  created_at: string;
}

/**
 * React Query mutation that uploads audio and transcribes it in one call.
 * Uses the /api/voice-notes/upload-and-transcribe endpoint.
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
