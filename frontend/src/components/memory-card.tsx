import { StructuredMemory } from "@/hooks/use-upload-voice-note";

const TYPE_STYLES = {
  idea: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-300 dark:border-purple-700",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    label: "Idea",
  },
  task: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-300 dark:border-orange-700",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    label: "Task",
  },
  note: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    label: "Note",
  },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MemoryCardProps {
  memory: StructuredMemory;
  transcript?: string | null;
  timestamp?: string | null;
}

/**
 * Displays a structured memory with type badge, title, content, tags,
 * and action items (for tasks).
 */
export function MemoryCard({ memory, transcript, timestamp }: MemoryCardProps) {
  const style = TYPE_STYLES[memory.type] || TYPE_STYLES.note;

  return (
    <div className={`w-full max-w-md rounded-lg border ${style.border} ${style.bg} p-5 space-y-3`}>
      {/* Header: type badge + title */}
      <div className="flex items-start gap-3">
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
          {style.label}
        </span>
        <h3 className="text-base font-semibold leading-tight text-foreground">
          {memory.title}
        </h3>
        {timestamp && (
          <span className="ml-auto shrink-0 text-xs text-foreground/30">
            {formatTime(timestamp)}
          </span>
        )}
      </div>

      {/* Structured content */}
      <p className="text-sm leading-relaxed text-foreground/75 line-clamp-3">
        {memory.content}
      </p>

      {/* Action items for tasks */}
      {memory.type === "task" && memory.action_items.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
            Action Items
          </p>
          <ul className="space-y-1">
            {memory.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-foreground/20" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible raw transcript */}
      {transcript && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-foreground/40 hover:text-foreground/60">
            Show raw transcript
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-foreground/50 italic">
            {transcript}
          </p>
        </details>
      )}
    </div>
  );
}
