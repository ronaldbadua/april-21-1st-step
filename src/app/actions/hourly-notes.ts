"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { HourlyNoteStatus } from "@/lib/supabase/database.types";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/hourly-notes");
}

export async function upsertHourlyNote(
  noteDate: string,
  hour: number,
  payload: {
    status: HourlyNoteStatus;
    content: string;
    author_name: string;
  }
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }
  if (hour < 0 || hour > 23) {
    return { ok: false, error: "Invalid hour." };
  }

  const { error } = await supabase.from("hourly_notes").upsert(
    {
      note_date: noteDate,
      hour,
      status: payload.status,
      content: payload.content.trim(),
      author_name: payload.author_name.trim() || "ICQA Team",
    },
    { onConflict: "note_date,hour" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidate();
  return { ok: true };
}

export async function deleteHourlyNote(noteDate: string, hour: number): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }
  const { error } = await supabase
    .from("hourly_notes")
    .delete()
    .eq("note_date", noteDate)
    .eq("hour", hour);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidate();
  return { ok: true };
}
