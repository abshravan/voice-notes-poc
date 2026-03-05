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
    <div className="flex min-h-screen flex-col items-center bg-background">
      {/* Header */}
      <header className="flex w-full items-center justify-between border-b border-foreground/10 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-medium text-foreground/60 hover:text-foreground"
        >
          &larr; Home
        </Link>
        <h1 className="text-lg font-semibold">Search Memories</h1>
        <div className="w-12" />
      </header>

      <main className="flex w-full max-w-2xl flex-col gap-6 p-6">
        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your memories..."
            className="flex-1 rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || searchMutation.isPending}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {searchMutation.isPending ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Results */}
        {searchMutation.isPending && (
          <p className="py-8 text-center text-sm text-foreground/40">
            Searching across your memories...
          </p>
        )}

        {searchMutation.isError && (
          <p className="py-8 text-center text-sm text-red-500">
            Search failed: {searchMutation.error.message}
          </p>
        )}

        {searchMutation.isSuccess && searchMutation.data.length === 0 && (
          <p className="py-8 text-center text-sm text-foreground/40">
            No matching memories found.
          </p>
        )}

        {searchMutation.isSuccess && searchMutation.data.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-foreground/40">
              {searchMutation.data.length} result{searchMutation.data.length !== 1 ? "s" : ""}
            </p>
            {searchMutation.data.map((result) => (
              <div key={result.memory.id} className="w-full max-w-md">
                <MemoryCard
                  memory={{
                    type: result.memory.type,
                    title: result.memory.title,
                    content: result.memory.content,
                    tags: result.memory.tags,
                    action_items: [],
                  }}
                  transcript={result.memory.transcript}
                />
                <p className="mt-1 text-right text-xs text-foreground/30">
                  Relevance: {(result.score * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
