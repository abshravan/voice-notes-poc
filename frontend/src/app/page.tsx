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
