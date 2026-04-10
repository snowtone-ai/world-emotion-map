export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="glass rounded-xl px-8 py-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--wem-text)]">
          World Emotion Map
        </h1>
        <p className="mt-2 text-sm text-[var(--wem-text-secondary)]">
          Feel What the World Feels
        </p>
        <div className="mt-6 h-px w-24 mx-auto bg-[var(--wem-border)]" />
        <p className="mt-6 text-xs text-[var(--wem-text-muted)]">
          Globe coming soon
        </p>
      </div>
    </div>
  );
}
