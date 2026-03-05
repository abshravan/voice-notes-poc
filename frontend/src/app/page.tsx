"use client";

import Link from "next/link";
import { useMemories } from "@/hooks/use-memories";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

interface Stats {
  total: number;
  ideas: number;
  tasks: number;
  notes: number;
}

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get<Stats>("/api/memories/stats"),
  });
  const { data: recentMemories } = useMemories();

  const recent = recentMemories?.slice(0, 3) ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 p-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 pt-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Voice Memory
          </h1>
          <p className="max-w-md text-lg text-foreground/60">
            Record voice notes, transcribe them into structured memories, and
            query them with natural language.
          </p>
        </div>

        {/* Primary actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/record"
            className="flex h-14 items-center gap-3 rounded-full bg-red-500 px-8 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-600 active:scale-95"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="1" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <line x1="8" y1="21" x2="16" y2="21" />
            </svg>
            New Voice Note
          </Link>
          <Link
            href="/memories"
            className="flex h-14 items-center gap-3 rounded-full border border-foreground/15 px-8 text-lg font-semibold text-foreground transition-transform hover:scale-105 hover:bg-foreground/5 active:scale-95"
          >
            My Memories
          </Link>
          <Link
            href="/search"
            className="flex h-14 items-center gap-3 rounded-full border border-foreground/15 px-8 text-lg font-semibold text-foreground transition-transform hover:scale-105 hover:bg-foreground/5 active:scale-95"
          >
            Search
          </Link>
          <Link
            href="/graph"
            className="flex h-14 items-center gap-3 rounded-full border border-foreground/15 px-8 text-lg font-semibold text-foreground transition-transform hover:scale-105 hover:bg-foreground/5 active:scale-95"
          >
            Mind Map
          </Link>
        </div>

        {/* Stats cards */}
        {stats && stats.total > 0 && (
          <div className="grid w-full grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Ideas", value: stats.ideas, color: "text-purple-600" },
              { label: "Tasks", value: stats.tasks, color: "text-orange-600" },
              { label: "Notes", value: stats.notes, color: "text-blue-600" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-lg border border-foreground/10 py-4"
              >
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                <span className="text-xs text-foreground/40">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent memories */}
        {recent.length > 0 && (
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/40">
                Recent Memories
              </h2>
              <Link href="/memories" className="text-xs text-foreground/40 hover:text-foreground">
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recent.map((mem) => {
                const typeColors = {
                  idea: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
                  task: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                  note: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                };
                return (
                  <Link
                    key={mem.id}
                    href={`/memories/${mem.id}`}
                    className="flex items-center gap-3 rounded-lg border border-foreground/10 p-4 transition-colors hover:bg-foreground/3"
                  >
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${typeColors[mem.type]}`}>
                      {mem.type}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {mem.title}
                    </span>
                    <span className="shrink-0 text-xs text-foreground/30">
                      {new Date(mem.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature cards (shown when no memories yet) */}
        {(!stats || stats.total === 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: "Record", description: "Capture voice notes with one tap" },
              { title: "Structure", description: "AI classifies into ideas, tasks, and notes" },
              { title: "Search", description: "Query your memories in natural language" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-foreground/10 p-6 text-left"
              >
                <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
                <p className="text-sm text-foreground/60">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
