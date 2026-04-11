export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-4xl">🌐</div>
      <h1 className="text-xl font-semibold text-[var(--wem-text)]">
        You&apos;re offline
      </h1>
      <p className="text-sm text-[var(--wem-text-secondary)] max-w-xs">
        No internet connection. The map will reload automatically when you&apos;re
        back online.
      </p>
    </div>
  );
}
