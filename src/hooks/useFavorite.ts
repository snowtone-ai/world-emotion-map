"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useFavorite(countryCode: string, userId: string | null) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "country")
      .eq("country_code", countryCode)
      .maybeSingle()
      .then(({ data }) => setIsFavorite(!!data));
  }, [countryCode, userId]);

  async function toggle() {
    if (!userId || loading) return;
    setLoading(true);
    const supabase = createClient();
    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("type", "country")
        .eq("country_code", countryCode);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: userId,
        type: "country",
        country_code: countryCode,
      });
      setIsFavorite(true);
    }
    setLoading(false);
  }

  // When not logged in, always report false (no DB query ran)
  return { isFavorite: userId ? isFavorite : false, toggle, loading };
}
