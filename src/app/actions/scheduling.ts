"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createScheduleEvent(data: {
  event_date: string;
  start_time: string;
  end_time: string;
  title: string;
  notes: string;
}): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }
  if (!data.title.trim()) {
    return { ok: false, error: "Title is required." };
  }
  const { error } = await supabase.from("schedule_events").insert({
    event_date: data.event_date,
    start_time: data.start_time,
    end_time: data.end_time,
    title: data.title.trim(),
    notes: data.notes?.trim() ?? "",
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/scheduling");
  return { ok: true };
}

export async function updateScheduleEvent(
  id: string,
  data: {
    event_date: string;
    start_time: string;
    end_time: string;
    title: string;
    notes: string;
  }
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }
  if (!data.title.trim()) {
    return { ok: false, error: "Title is required." };
  }
  const { error } = await supabase
    .from("schedule_events")
    .update({
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      title: data.title.trim(),
      notes: data.notes?.trim() ?? "",
    })
    .eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/scheduling");
  return { ok: true };
}

export async function deleteScheduleEvent(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured on the server." };
  }
  const { error } = await supabase.from("schedule_events").delete().eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/scheduling");
  return { ok: true };
}
