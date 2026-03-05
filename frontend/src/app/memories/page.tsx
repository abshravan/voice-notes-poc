"use client";

import { useState } from "react";
import Link from "next/link";
import { useMemories } from "@/hooks/use-memories";
import { MemoryCard } from "@/components/memory-card";

const FILTER_OPTIONS = [
  { label: "All", value: undefined },
  { label: "Ideas", value: "idea" },
  { label: "Tasks", value: "task" },
  { label: "Notes", value: "note" },
] as const;

export default function MemoriesPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: memories, isLoading, error } = useMemories(filter);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
      {/* Header */}
      <header className="flex w-full items-center justify-between border-b border-foreground/10 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-medium text-foreground/60 hover:text-foreground"
        >
          &larr; Home
        </Link>
        <h1 className="text-lg font-semibold">Memories</h1>
        <Link
          href="/record"
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          + New
        </Link>
      </header>

      <main className="flex w-full max-w-2xl flex-col gap-4 p-6">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === opt.value
                  ? "bg-foreground text-background"
                  : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <p className="py-12 text-center text-sm text-foreground/40">Loading memories...</p>
        )}

        {error && (
          <p className="py-12 text-center text-sm text-red-500">
            Failed to load memories. Is the backend running?
          </p>
        )}

        {memories && memories.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-foreground/40">No memories yet.</p>
            <Link href="/record" className="mt-2 inline-block text-sm text-red-500 hover:underline">
              Record your first voice note
            </Link>
          </div>
        )}

        {memories && memories.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            {memories.map((mem) => (
              <MemoryCard
                key={mem.id}
                memory={{
                  type: mem.type,
                  title: mem.title,
                  content: mem.content,
                  tags: mem.tags,
                  action_items: [],
                }}
                transcript={mem.transcript}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
