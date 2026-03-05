"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ── Types ────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: string;
  group: "memory" | "tag";
  // Simulation state
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface MemoryGraphProps {
  nodes: { id: string; label: string; type: string; group: string }[];
  edges: { source: string; target: string }[];
  onNodeClick?: (nodeId: string, group: string) => void;
}

// ── Color palette ────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  idea: "#a855f7",   // purple
  task: "#f97316",   // orange
  note: "#3b82f6",   // blue
  tag: "#6b7280",    // gray
};

const NODE_RADII: Record<string, number> = {
  memory: 20,
  tag: 10,
};

// ── Force simulation ─────────────────────────────────────

const REPULSION = 800;
const ATTRACTION = 0.005;
const CENTER_GRAVITY = 0.01;
const DAMPING = 0.92;
const REST_LENGTH = 120;

function simulate(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
) {
  const cx = width / 2;
  const cy = height / 2;

  // Build adjacency for fast lookup
  const edgePairs = edges.map((e) => ({
    si: nodes.findIndex((n) => n.id === e.source),
    ti: nodes.findIndex((n) => n.id === e.target),
  })).filter((p) => p.si >= 0 && p.ti >= 0);

  // Repulsion (all pairs)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = REPULSION / (dist * dist);
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      a.vx -= dx;
      a.vy -= dy;
      b.vx += dx;
      b.vy += dy;
    }
  }

  // Attraction (edges)
  for (const { si, ti } of edgePairs) {
    const a = nodes[si];
    const b = nodes[ti];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const force = (dist - REST_LENGTH) * ATTRACTION;
    const fx = dx * force;
    const fy = dy * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Center gravity
  for (const node of nodes) {
    node.vx += (cx - node.x) * CENTER_GRAVITY;
    node.vy += (cy - node.y) * CENTER_GRAVITY;
  }

  // Integrate
  for (const node of nodes) {
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    node.x += node.vx;
    node.y += node.vy;
  }
}

// ── Component ────────────────────────────────────────────

export function MemoryGraph({ nodes: rawNodes, edges, onNodeClick }: MemoryGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const animRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const dragRef = useRef<{ nodeIdx: number; offsetX: number; offsetY: number } | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Initialize nodes with random positions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    nodesRef.current = rawNodes.map((n) => ({
      ...n,
      group: n.group as "memory" | "tag",
      x: w / 2 + (Math.random() - 0.5) * w * 0.6,
      y: h / 2 + (Math.random() - 0.5) * h * 0.6,
      vx: 0,
      vy: 0,
    }));
  }, [rawNodes]);

  // Screen to world coordinates
  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - panRef.current.x) / scaleRef.current,
      y: (sy - panRef.current.y) / scaleRef.current,
    };
  }, []);

  // Find node at world position
  const nodeAt = useCallback((wx: number, wy: number): number => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = NODE_RADII[n.group] ?? 14;
      const dx = wx - n.x;
      const dy = wy - n.y;
      if (dx * dx + dy * dy <= r * r) return i;
    }
    return -1;
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const nodes = nodesRef.current;

      if (nodes.length > 0 && !dragRef.current) {
        simulate(nodes, edges, w, h);
      }

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      // Draw edges
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (const edge of edges) {
        const s = nodes.find((n) => n.id === edge.source);
        const t = nodes.find((n) => n.id === edge.target);
        if (!s || !t) continue;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        const r = NODE_RADII[node.group] ?? 14;
        const color = NODE_COLORS[node.type] ?? NODE_COLORS.tag;
        const isHovered = node.id === hoveredNode;

        // Glow for hovered
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = color + "30";
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? color : color + "cc";
        ctx.fill();

        // Border
        ctx.strokeStyle = isHovered ? "#fff" : color;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Label
        const fontSize = node.group === "tag" ? 9 : 11;
        ctx.font = `${isHovered ? "bold " : ""}${fontSize}px system-ui, sans-serif`;
        ctx.fillStyle = isHovered ? "#fff" : "rgba(255,255,255,0.7)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const label = node.label.length > 20 ? node.label.slice(0, 18) + "..." : node.label;
        ctx.fillText(label, node.x, node.y + r + 4);
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [edges, hoveredNode]);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x: wx, y: wy } = screenToWorld(sx, sy);
    const idx = nodeAt(wx, wy);

    if (idx >= 0) {
      const node = nodesRef.current[idx];
      dragRef.current = { nodeIdx: idx, offsetX: wx - node.x, offsetY: wy - node.y };
    } else {
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [screenToWorld, nodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (dragRef.current) {
      const { x: wx, y: wy } = screenToWorld(sx, sy);
      const node = nodesRef.current[dragRef.current.nodeIdx];
      node.x = wx - dragRef.current.offsetX;
      node.y = wy - dragRef.current.offsetY;
      node.vx = 0;
      node.vy = 0;
      return;
    }

    if (isPanningRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      panRef.current.x += dx;
      panRef.current.y += dy;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hover detection
    const { x: wx, y: wy } = screenToWorld(sx, sy);
    const idx = nodeAt(wx, wy);
    const hId = idx >= 0 ? nodesRef.current[idx].id : null;
    setHoveredNode(hId);
  }, [screenToWorld, nodeAt]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current = null;
    }
    isPanningRef.current = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !onNodeClick) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x: wx, y: wy } = screenToWorld(sx, sy);
    const idx = nodeAt(wx, wy);
    if (idx >= 0) {
      const node = nodesRef.current[idx];
      onNodeClick(node.id, node.group);
    }
  }, [onNodeClick, screenToWorld, nodeAt]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const oldScale = scaleRef.current;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(oldScale * factor, 0.2), 5);

    // Zoom toward cursor
    panRef.current.x = sx - (sx - panRef.current.x) * (newScale / oldScale);
    panRef.current.y = sy - (sy - panRef.current.y) * (newScale / oldScale);
    scaleRef.current = newScale;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-grab active:cursor-grabbing"
      style={{ display: "block" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  );
}
