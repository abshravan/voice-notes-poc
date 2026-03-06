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
  const recent = recentMemories?.slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Voice Memory
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Record voice notes, transcribe them into structured memories, and
          query them with natural language.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          href="/record"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="1" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          New Voice Note
        </Link>
        <Link href="/memories" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface">
          All Memories
        </Link>
        <Link href="/graph" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface">
          Mind Map
        </Link>
      </div>

      {stats && stats.total > 0 && (
        <div className="mb-10 grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Ideas", value: stats.ideas, color: "text-idea" },
            { label: "Tasks", value: stats.tasks, color: "text-task" },
            { label: "Notes", value: stats.notes, color: "text-note" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-surface px-4 py-4 text-center">
              <div className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Recent</h2>
            <Link href="/memories" className="text-xs text-muted hover:text-foreground transition-colors">View all</Link>
          </div>
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {recent.map((mem) => {
              const tc = { idea: "text-idea bg-idea-bg", task: "text-task bg-task-bg", note: "text-note bg-note-bg" };
              return (
                <Link key={mem.id} href={`/memories/${mem.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface">
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tc[mem.type]}`}>{mem.type}</span>
                  <span className="flex-1 truncate text-sm text-foreground">{mem.title}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted">{new Date(mem.created_at).toLocaleDateString()}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {(!stats || stats.total === 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: "Record", desc: "Capture voice notes with one tap" },
            { title: "Structure", desc: "AI classifies into ideas, tasks, and notes" },
            { title: "Search", desc: "Query your memories in natural language" },
          ].map((f) => (
            <div key={f.title} className="rounded-lg bg-surface p-5">
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
