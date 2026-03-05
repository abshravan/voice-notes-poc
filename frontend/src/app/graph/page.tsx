"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { MemoryGraph } from "@/components/memory-graph";

interface GraphData {
  nodes: { id: string; label: string; type: string; group: string }[];
  edges: { source: string; target: string }[];
}

export default function GraphPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["graph"],
    queryFn: () => api.get<GraphData>("/api/memories/graph"),
  });

  const handleNodeClick = (nodeId: string, group: string) => {
    if (group === "memory") {
      router.push(`/memories/${nodeId}`);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3">
        <Link
          href="/"
          className="text-sm font-medium text-white/60 hover:text-white"
        >
          &larr; Home
        </Link>
        <h1 className="text-lg font-semibold text-white">Mind Map</h1>
        <Link
          href="/memories"
          className="text-sm font-medium text-white/60 hover:text-white"
        >
          List View
        </Link>
      </header>

      {/* Legend */}
      <div className="flex shrink-0 items-center justify-center gap-6 border-b border-white/5 px-6 py-2">
        {[
          { label: "Ideas", color: "#a855f7" },
          { label: "Tasks", color: "#f97316" },
          { label: "Notes", color: "#3b82f6" },
          { label: "Tags", color: "#6b7280" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-white/50">{item.label}</span>
          </div>
        ))}
        <span className="text-xs text-white/30">|</span>
        <span className="text-xs text-white/30">
          Scroll to zoom. Drag to pan. Click a memory to open.
        </span>
      </div>

      {/* Graph */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-white/40">Loading graph...</p>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-red-400">
              Failed to load graph. Is the backend running?
            </p>
          </div>
        )}

        {data && data.nodes.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-white/40">No memories to visualize yet.</p>
            <Link
              href="/record"
              className="text-sm text-red-400 hover:underline"
            >
              Record your first voice note
            </Link>
          </div>
        )}

        {data && data.nodes.length > 0 && (
          <MemoryGraph
            nodes={data.nodes}
            edges={data.edges}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>
    </div>
  );
}
