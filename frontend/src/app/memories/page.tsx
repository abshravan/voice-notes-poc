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
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Memories</h1>
        <p className="mt-1 text-[13px] text-muted">All your captured voice notes</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setFilter(opt.value)}
            className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              filter === opt.value
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="py-12 text-center text-sm text-muted">Loading memories...</p>
      )}

      {error && (
        <p className="py-12 text-center text-sm text-danger">
          Failed to load memories. Is the backend running?
        </p>
      )}

      {memories && memories.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted">No memories yet.</p>
          <Link href="/record" className="mt-2 inline-block text-sm text-accent hover:underline">
            Record your first voice note
          </Link>
        </div>
      )}

      {grouped.length > 0 && (
        <div className="flex flex-col gap-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </h2>
              <div className="flex flex-col gap-2">
                {group.items.map((mem) => (
                  <Link key={mem.id} href={`/memories/${mem.id}`} className="block">
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
    </div>
  );
}
