"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function removeFavorite(favoriteId: string, locale: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("favorites")
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", user.id);

  revalidatePath(`/${locale}/favorites`);
}
