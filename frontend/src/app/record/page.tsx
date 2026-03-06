import { VoiceRecorder } from "@/components/voice-recorder";

export default function RecordPage() {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="mx-auto w-full max-w-3xl px-8 pt-10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Record</h1>
        <p className="mt-1 text-[13px] text-muted">Capture a new voice note</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <VoiceRecorder />
      </div>
    </div>
  );
}
