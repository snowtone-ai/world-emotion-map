const FALSE_VALUES = new Set(["0", "false", "off", "no"]);

export function isSupabasePaused(): boolean {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PAUSED?.toLowerCase();
  if (!value) return true;
  return !FALSE_VALUES.has(value);
}

