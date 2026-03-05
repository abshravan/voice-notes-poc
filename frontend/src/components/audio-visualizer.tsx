"use client";

import { useRef, useEffect } from "react";

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  width?: number;
  height?: number;
}

/**
 * Real-time waveform visualizer using Web Audio API's AnalyserNode.
 * Draws frequency bars on a canvas element while recording is active.
 */
export function AudioVisualizer({
  analyserNode,
  isActive,
  width = 300,
  height = 100,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode || !isActive) {
      // Draw flat line when not active
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
      }
      return;
    }

    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      const barCount = 40;
      const step = Math.floor(bufferLength / barCount);
      const barWidth = canvas!.width / barCount - 2;
      const centerY = canvas!.height / 2;

      for (let i = 0; i < barCount; i++) {
        // Average a range of frequencies for smoother bars
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        const avg = sum / step;
        const barHeight = (avg / 255) * centerY * 0.9;

        const x = i * (barWidth + 2) + 1;
        // Gradient from blue to purple based on amplitude
        const hue = 220 + (avg / 255) * 40;
        ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.85)`;

        // Draw mirrored bars from center
        const radius = Math.min(barWidth / 2, 3);
        roundRect(ctx, x, centerY - barHeight, barWidth, barHeight * 2, radius);
      }
    }

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode, isActive, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full max-w-sm rounded-lg"
    />
  );
}

// Helper to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
