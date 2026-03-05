import { create } from "zustand";
import type { VoiceNote } from "@/types/memory";

interface AppState {
  // Current recording state
  isRecording: boolean;
  currentNote: VoiceNote | null;

  // Actions
  setRecording: (isRecording: boolean) => void;
  setCurrentNote: (note: VoiceNote | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isRecording: false,
  currentNote: null,

  setRecording: (isRecording) => set({ isRecording }),
  setCurrentNote: (currentNote) => set({ currentNote }),
}));
