"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchMemories } from "@/hooks/use-search-memories";
import { MemoryCard } from "@/components/memory-card";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const searchMutation = useSearchMemories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate(query.trim());
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Search</h1>
        <p className="mt-1 text-[13px] text-muted">Find memories using natural language</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your memories..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!query.trim() || searchMutation.isPending}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {searchMutation.isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {searchMutation.isPending && (
        <p className="py-8 text-center text-sm text-muted">
          Searching across your memories...
        </p>
      )}

      {searchMutation.isError && (
        <p className="py-8 text-center text-sm text-danger">
          Search failed: {searchMutation.error.message}
        </p>
      )}

      {searchMutation.isSuccess && searchMutation.data.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">
          No matching memories found.
        </p>
      )}

      {searchMutation.isSuccess && searchMutation.data.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-muted">
            {searchMutation.data.length} result{searchMutation.data.length !== 1 ? "s" : ""}
          </p>
          {searchMutation.data.map((result) => (
            <Link key={result.memory.id} href={`/memories/${result.memory.id}`} className="block">
              <MemoryCard
                memory={{
                  type: result.memory.type,
                  title: result.memory.title,
                  content: result.memory.content,
                  tags: result.memory.tags,
                  action_items: result.memory.action_items || [],
                }}
              />
              <p className="mt-1 text-right text-[11px] text-muted">
                Relevance: {(result.score * 100).toFixed(1)}%
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
