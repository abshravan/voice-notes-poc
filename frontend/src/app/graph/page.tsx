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
    <div className="flex h-full flex-col bg-background">
      {/* Legend */}
      <div className="flex shrink-0 items-center justify-center gap-6 border-b border-border px-6 py-2.5">
        {[
          { label: "Ideas", color: "bg-idea" },
          { label: "Tasks", color: "bg-task" },
          { label: "Notes", color: "bg-note" },
          { label: "Tags", color: "bg-muted" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
            <span className="text-[11px] text-muted">{item.label}</span>
          </div>
        ))}
        <span className="text-[11px] text-muted/50">|</span>
        <span className="text-[11px] text-muted/50">
          Scroll to zoom. Drag to pan. Click a memory to open.
        </span>
      </div>

      {/* Graph */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted">Loading graph...</p>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-danger">
              Failed to load graph. Is the backend running?
            </p>
          </div>
        )}

        {data && data.nodes.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-muted">No memories to visualize yet.</p>
            <Link href="/record" className="text-sm text-accent hover:underline">
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
