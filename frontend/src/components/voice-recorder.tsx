"use client";

import { useAudioRecorder, RecordingState } from "@/hooks/use-audio-recorder";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { useAppStore } from "@/stores/app-store";

/** Format seconds as mm:ss */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Main voice recording component.
 * Handles the full recording lifecycle: idle → recording → stopped → review.
 */
export function VoiceRecorder() {
  const { state, duration, audioBlob, audioUrl, analyserNode, start, pause, resume, stop, reset } =
    useAudioRecorder();
  const setRecording = useAppStore((s) => s.setRecording);

  const handleStart = async () => {
    try {
      await start();
      setRecording(true);
    } catch {
      alert("Microphone access is required to record voice notes.");
    }
  };

  const handleStop = () => {
    stop();
    setRecording(false);
  };

  const handleReset = () => {
    reset();
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform visualizer */}
      <AudioVisualizer
        analyserNode={analyserNode}
        isActive={state === "recording"}
        width={320}
        height={100}
      />

      {/* Timer display */}
      <div className="text-4xl font-mono font-semibold tabular-nums tracking-wider text-foreground">
        {formatTime(duration)}
      </div>

      {/* Recording state label */}
      <StatusLabel state={state} />

      {/* Control buttons */}
      <div className="flex items-center gap-4">
        {state === "idle" && (
          <RecordButton onClick={handleStart} label="Record" />
        )}

        {state === "recording" && (
          <>
            <ControlButton onClick={pause} label="Pause" icon="pause" />
            <StopButton onClick={handleStop} />
          </>
        )}

        {state === "paused" && (
          <>
            <ControlButton onClick={resume} label="Resume" icon="resume" />
            <StopButton onClick={handleStop} />
          </>
        )}

        {state === "stopped" && (
          <>
            <ControlButton onClick={handleReset} label="New Recording" icon="reset" />
            {/* Upload button will be wired in Phase 3 */}
            <UploadButton audioBlob={audioBlob} />
          </>
        )}
      </div>

      {/* Audio playback when stopped */}
      {state === "stopped" && audioUrl && (
        <audio controls src={audioUrl} className="mt-4 w-full max-w-sm" />
      )}
    </div>
  );
}

function StatusLabel({ state }: { state: RecordingState }) {
  const labels: Record<RecordingState, string> = {
    idle: "Tap to start recording",
    recording: "Recording...",
    paused: "Paused",
    stopped: "Recording complete",
  };
  const colors: Record<RecordingState, string> = {
    idle: "text-foreground/40",
    recording: "text-red-500",
    paused: "text-yellow-500",
    stopped: "text-green-600",
  };
  return (
    <p className={`text-sm font-medium ${colors[state]}`}>{labels[state]}</p>
  );
}

function RecordButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-600 active:scale-95"
      aria-label={label}
    >
      {/* Microphone icon */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="1" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    </button>
  );
}

function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label="Stop"
    >
      {/* Stop square icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    </button>
  );
}

function ControlButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: "pause" | "resume" | "reset";
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 items-center gap-2 rounded-full border border-foreground/15 bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 active:bg-foreground/10"
      aria-label={label}
    >
      {icon === "pause" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      )}
      {icon === "resume" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="6,4 20,12 6,20" />
        </svg>
      )}
      {icon === "reset" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      )}
      {label}
    </button>
  );
}

function UploadButton({ audioBlob }: { audioBlob: Blob | null }) {
  const handleUpload = () => {
    if (!audioBlob) return;
    // Upload logic will be wired in Phase 3
    alert(`Ready to upload: ${(audioBlob.size / 1024).toFixed(1)} KB`);
  };

  return (
    <button
      onClick={handleUpload}
      disabled={!audioBlob}
      className="flex h-12 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      Save & Process
    </button>
  );
}
