import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Voice Memory
          </h1>
          <p className="max-w-md text-lg text-foreground/60">
            Record voice notes, transcribe them into structured memories, and
            query them with natural language.
          </p>
        </div>

        {/* Primary actions */}
        <div className="flex items-center gap-4">
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: "Record",
              description: "Capture voice notes with one tap",
            },
            {
              title: "Structure",
              description: "AI classifies into ideas, tasks, and notes",
            },
            {
              title: "Search",
              description: "Query your memories in natural language",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-foreground/10 p-6 text-left"
            >
              <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
              <p className="text-sm text-foreground/60">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
