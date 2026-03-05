"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMemories, type MemoryItem } from "@/hooks/use-memories";
import { MemoryCard } from "@/components/memory-card";

const FILTER_OPTIONS = [
  { label: "All", value: undefined },
  { label: "Ideas", value: "idea" },
  { label: "Tasks", value: "task" },
  { label: "Notes", value: "note" },
] as const;

function groupByDate(memories: MemoryItem[]) {
  const groups: { label: string; items: MemoryItem[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const mem of memories) {
    const date = new Date(mem.created_at);
    date.setHours(0, 0, 0, 0);

    let label: string;
    if (date.getTime() === today.getTime()) {
      label = "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }

    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(mem);
    } else {
      groups.push({ label, items: [mem] });
    }
  }

  return groups;
}

export default function MemoriesPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: memories, isLoading, error } = useMemories(filter);

  const grouped = useMemo(
    () => (memories ? groupByDate(memories) : []),
    [memories],
  );

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

        {grouped.length > 0 && (
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/40">
                  {group.label}
                </h2>
                <div className="flex flex-col items-center gap-4">
                  {group.items.map((mem) => (
                    <Link key={mem.id} href={`/memories/${mem.id}`} className="w-full max-w-md">
                      <MemoryCard
                        memory={{
                          type: mem.type,
                          title: mem.title,
                          content: mem.content,
                          tags: mem.tags,
                          action_items: mem.action_items || [],
                        }}
                        timestamp={mem.created_at}
                      />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
