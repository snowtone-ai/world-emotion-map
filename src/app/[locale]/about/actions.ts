"use server";

import { createClient } from "@/lib/supabase/server";

type SubscribeResult = { success: boolean; error?: string };

export async function subscribeEmail(
  _prev: SubscribeResult | null,
  formData: FormData
): Promise<SubscribeResult> {
  const email = formData.get("email")?.toString().trim() ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_subscribers")
    .insert({ email, source: "about" });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You're already subscribed." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
