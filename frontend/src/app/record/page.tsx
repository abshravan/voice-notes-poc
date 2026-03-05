import { VoiceRecorder } from "@/components/voice-recorder";
import Link from "next/link";

export default function RecordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
      {/* Header */}
      <header className="flex w-full items-center justify-between border-b border-foreground/10 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-medium text-foreground/60 hover:text-foreground"
        >
          &larr; Back
        </Link>
        <h1 className="text-lg font-semibold">New Voice Note</h1>
        <div className="w-12" /> {/* Spacer for centering */}
      </header>

      {/* Recording area */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <VoiceRecorder />
      </main>
    </div>
  );
}
