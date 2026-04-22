"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function sendChatMessage(body: string, authorName: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }
  const text = body.trim();
  if (!text) {
    return { ok: false, error: "Message cannot be empty." };
  }
  const { error } = await supabase.from("chat_messages").insert({
    body: text,
    author_name: authorName.trim() || "ICQA Team",
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/chat");
  return { ok: true };
}

export async function deleteChatMessage(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }
  const { error } = await supabase.from("chat_messages").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/chat");
  return { ok: true };
}
