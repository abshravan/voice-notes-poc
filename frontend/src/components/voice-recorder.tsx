"use client";

import Link from "next/link";
import { useAudioRecorder, RecordingState } from "@/hooks/use-audio-recorder";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { useAppStore } from "@/stores/app-store";
import { useUploadVoiceNote } from "@/hooks/use-upload-voice-note";
import { MemoryCard } from "@/components/memory-card";

/** Format seconds as mm:ss */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceRecorder() {
  const { state, duration, audioBlob, audioUrl, analyserNode, start, pause, resume, stop, reset } =
    useAudioRecorder();
  const setRecording = useAppStore((s) => s.setRecording);
  const uploadMutation = useUploadVoiceNote();

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
    uploadMutation.reset();
    setRecording(false);
  };

  const handleUpload = () => {
    if (!audioBlob) return;
    uploadMutation.mutate(audioBlob);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <AudioVisualizer
        analyserNode={analyserNode}
        isActive={state === "recording"}
        width={320}
        height={100}
      />

      <div className="text-4xl font-mono font-semibold tabular-nums tracking-wider text-foreground">
        {formatTime(duration)}
      </div>

      <StatusLabel state={state} />

      {uploadMutation.isPending && (
        <div className="flex items-center gap-2 text-sm text-accent">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading & transcribing...
        </div>
      )}
      {uploadMutation.isSuccess && (
        <div className="w-full max-w-md space-y-3">
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-accent">
            <p className="font-medium">Processed successfully</p>
            <p className="mt-1 text-[11px] opacity-70">
              ID: {uploadMutation.data.id} &middot;{" "}
              {(uploadMutation.data.file_size / 1024).toFixed(1)} KB
              {uploadMutation.data.duration_seconds > 0 &&
                ` \u00b7 ${uploadMutation.data.duration_seconds.toFixed(1)}s`}
            </p>
          </div>
          {uploadMutation.data.memory ? (
            <MemoryCard
              memory={uploadMutation.data.memory}
              transcript={uploadMutation.data.transcript}
            />
          ) : uploadMutation.data.transcript ? (
            <div className="rounded-lg border border-border p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Transcript
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">
                {uploadMutation.data.transcript}
              </p>
            </div>
          ) : null}
          {uploadMutation.data.memory_id && (
            <Link
              href={`/memories/${uploadMutation.data.memory_id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover"
            >
              View memory &rarr;
            </Link>
          )}
        </div>
      )}
      {uploadMutation.isError && (
        <p className="text-sm text-danger">
          Upload failed: {uploadMutation.error.message}
        </p>
      )}

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
            <UploadButton
              onClick={handleUpload}
              disabled={!audioBlob || uploadMutation.isPending || uploadMutation.isSuccess}
              isUploading={uploadMutation.isPending}
            />
          </>
        )}
      </div>

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
    idle: "text-muted",
    recording: "text-danger",
    paused: "text-task",
    stopped: "text-accent",
  };
  return (
    <p className={`text-sm font-medium ${colors[state]}`}>{labels[state]}</p>
  );
}

function RecordButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-lg transition-transform hover:scale-105 hover:bg-danger/90 active:scale-95"
      aria-label={label}
    >
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
      className="flex h-12 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface active:bg-surface-hover"
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

function UploadButton({
  onClick,
  disabled,
  isUploading,
}: {
  onClick: () => void;
  disabled: boolean;
  isUploading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white shadow-md transition-transform hover:scale-105 hover:bg-accent-hover active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
    >
      {isUploading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      )}
      {isUploading ? "Uploading..." : "Save & Process"}
    </button>
  );
}
