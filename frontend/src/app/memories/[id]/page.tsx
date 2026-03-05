"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemory, useDeleteMemory } from "@/hooks/use-memories";
import { api } from "@/services/api";

const TYPE_STYLES = {
  idea: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-300 dark:border-purple-700",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    label: "Idea",
  },
  task: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-300 dark:border-orange-700",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    label: "Task",
  },
  note: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    label: "Note",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: memory, isLoading, error } = useMemory(id);
  const deleteMutation = useDeleteMemory();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-foreground/40">Loading memory...</p>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-red-500">Memory not found.</p>
        <Link href="/memories" className="text-sm text-foreground/60 hover:text-foreground">
          &larr; Back to memories
        </Link>
      </div>
    );
  }

  const style = TYPE_STYLES[memory.type] || TYPE_STYLES.note;

  const handleDelete = async () => {
    if (!confirm("Delete this memory? This cannot be undone.")) return;
    await deleteMutation.mutateAsync(id);
    router.push("/memories");
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
      {/* Header */}
      <header className="flex w-full items-center justify-between border-b border-foreground/10 px-6 py-4">
        <Link
          href="/memories"
          className="text-sm font-medium text-foreground/60 hover:text-foreground"
        >
          &larr; Memories
        </Link>
        <h1 className="text-lg font-semibold">Detail</h1>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </button>
      </header>

      <main className="flex w-full max-w-2xl flex-col gap-6 p-6">
        {/* Type badge + title */}
        <div className="flex items-start gap-3">
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
            {style.label}
          </span>
          <h2 className="text-xl font-bold leading-tight text-foreground">
            {memory.title}
          </h2>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-foreground/40">
          {formatDate(memory.created_at)}
        </p>

        {/* Audio player */}
        {memory.audio_url && (
          <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
              Audio Recording
            </p>
            <audio controls className="w-full" preload="metadata">
              <source src={api.audioUrl(memory.id)} />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {/* Content */}
        <div className={`rounded-lg border ${style.border} ${style.bg} p-5 space-y-4`}>
          <p className="text-sm leading-relaxed text-foreground/75">
            {memory.content}
          </p>

          {/* Action items for tasks */}
          {memory.type === "task" && memory.action_items.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
                Action Items
              </p>
              <ul className="space-y-1">
                {memory.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                    <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-foreground/20" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Raw transcript */}
        {memory.transcript && (
          <div className="rounded-lg border border-foreground/10 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
              Raw Transcript
            </p>
            <p className="text-sm leading-relaxed text-foreground/50 italic">
              {memory.transcript}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
