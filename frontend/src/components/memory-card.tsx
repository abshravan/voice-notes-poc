import { StructuredMemory } from "@/hooks/use-upload-voice-note";

const TYPE_STYLES = {
  idea: { bg: "bg-idea-bg", text: "text-idea", badge: "bg-idea-subtle text-idea", label: "Idea" },
  task: { bg: "bg-task-bg", text: "text-task", badge: "bg-task-subtle text-task", label: "Task" },
  note: { bg: "bg-note-bg", text: "text-note", badge: "bg-note-subtle text-note", label: "Note" },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

interface MemoryCardProps {
  memory: StructuredMemory;
  transcript?: string | null;
  timestamp?: string | null;
}

export function MemoryCard({ memory, transcript, timestamp }: MemoryCardProps) {
  const style = TYPE_STYLES[memory.type] || TYPE_STYLES.note;

  return (
    <div className={`w-full rounded-lg ${style.bg} p-4 space-y-2.5 transition-colors`}>
      <div className="flex items-start gap-2.5">
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>
          {style.label}
        </span>
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {memory.title}
        </h3>
        {timestamp && (
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted">
            {formatTime(timestamp)}
          </span>
        )}
      </div>

      <p className="text-[13px] leading-relaxed text-foreground/70 line-clamp-3">
        {memory.content}
      </p>

      {memory.type === "task" && memory.action_items.length > 0 && (
        <ul className="space-y-1 pl-0.5">
          {memory.action_items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/65">
              <span className="mt-[5px] h-3 w-3 shrink-0 rounded-sm border border-border" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {memory.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] text-muted">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {transcript && (
        <details className="group">
          <summary className="cursor-pointer text-[11px] font-medium text-muted hover:text-foreground transition-colors">
            Show transcript
          </summary>
          <p className="mt-2 text-[12px] leading-relaxed text-muted italic">
            {transcript}
          </p>
        </details>
      )}
    </div>
  );
}
