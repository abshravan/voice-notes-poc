"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemory, useDeleteMemory } from "@/hooks/use-memories";
import { api } from "@/services/api";

const TYPE_STYLES = {
  idea: {
    bg: "bg-idea-bg",
    border: "border-idea-subtle",
    badge: "bg-idea-subtle text-idea",
    label: "Idea",
  },
  task: {
    bg: "bg-task-bg",
    border: "border-task-subtle",
    badge: "bg-task-subtle text-task",
    label: "Task",
  },
  note: {
    bg: "bg-note-bg",
    border: "border-note-subtle",
    badge: "bg-note-subtle text-note",
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
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted">Loading memory...</p>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-danger">Memory not found.</p>
        <Link href="/memories" className="text-sm text-muted hover:text-foreground">
          Back to memories
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
    <div className="mx-auto max-w-3xl px-8 py-10">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/memories" className="text-[13px] font-medium text-muted hover:text-foreground transition-colors">
          &larr; Back to Memories
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-[13px] font-medium text-danger hover:text-danger/80 disabled:opacity-50 transition-colors"
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </button>
      </div>

      {/* Type badge + title */}
      <div className="mb-2 flex items-start gap-3">
        <span className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}>
          {style.label}
        </span>
        <h1 className="text-xl font-bold leading-tight text-foreground">
          {memory.title}
        </h1>
      </div>

      {/* Timestamp */}
      <p className="mb-6 text-[11px] text-muted">
        {formatDate(memory.created_at)}
      </p>

      {/* Audio player */}
      {memory.audio_url && (
        <div className={`mb-6 rounded-lg border ${style.border} ${style.bg} p-4`}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
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
        <p className="text-sm leading-relaxed text-foreground/80">
          {memory.content}
        </p>

        {memory.type === "task" && memory.action_items.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Action Items
            </p>
            <ul className="space-y-1">
              {memory.action_items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/75">
                  <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-border" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {memory.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Raw transcript */}
      {memory.transcript && (
        <div className="mt-6 rounded-lg border border-border p-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Raw Transcript
          </p>
          <p className="text-sm leading-relaxed text-muted italic">
            {memory.transcript}
          </p>
        </div>
      )}
    </div>
  );
}
