"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Props = {
  regionLabel: string;
  sectorLabel: string;
};

export function ViewToggle({ regionLabel, sectorLabel }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const view = searchParams?.get("view") ?? "region";

  function switchTo(next: "region" | "sector") {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "region") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="hidden sm:flex items-center glass rounded-lg p-0.5 text-xs">
      <button
        onClick={() => switchTo("region")}
        className={[
          "px-3 py-1 rounded-md font-medium transition-colors",
          view === "region"
            ? "bg-[var(--wem-accent)] text-white"
            : "text-[var(--wem-text-secondary)] hover:text-white hover:bg-white/10",
        ].join(" ")}
      >
        {regionLabel}
      </button>
      <button
        onClick={() => switchTo("sector")}
        className={[
          "px-3 py-1 rounded-md font-medium transition-colors",
          view === "sector"
            ? "bg-[var(--wem-accent)] text-white"
            : "text-[var(--wem-text-secondary)] hover:text-white hover:bg-white/10",
        ].join(" ")}
      >
        {sectorLabel}
      </button>
    </div>
  );
}
