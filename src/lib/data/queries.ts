import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { HourlyNoteStatus, ProcessStage } from "@/lib/supabase/database.types";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getHourlyNotesForDate(dateStr: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { rows: [] as { id: string; hour: number; status: HourlyNoteStatus; content: string; author_name: string }[], error: "missing_config" as const };
  }
  const { data, error } = await supabase
    .from("hourly_notes")
    .select("id, hour, status, content, author_name")
    .eq("note_date", dateStr)
    .order("hour", { ascending: true });
  if (error) {
    return { rows: [] as { id: string; hour: number; status: HourlyNoteStatus; content: string; author_name: string }[], error: error.message };
  }
  return { rows: (data ?? []) as { id: string; hour: number; status: HourlyNoteStatus; content: string; author_name: string }[], error: null };
}

export async function getChatMessages(limit = 200) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { messages: [] as { id: string; body: string; author_name: string; created_at: string }[], error: "missing_config" as const };
  }
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, body, author_name, created_at")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    return { messages: [] as { id: string; body: string; author_name: string; created_at: string }[], error: error.message };
  }
  return { messages: (data ?? []) as { id: string; body: string; author_name: string; created_at: string }[], error: null };
}

export async function getScheduleEvents(weekStart: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { events: [] as ScheduleRow[], error: "missing_config" as const };
  }
  const [y, m, d] = weekStart.split("-").map(Number);
  const startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endStr = toDateString(endDate);

  const { data, error } = await supabase
    .from("schedule_events")
    .select("id, event_date, start_time, end_time, title, notes, created_at")
    .gte("event_date", weekStart)
    .lte("event_date", endStr)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) {
    return { events: [] as ScheduleRow[], error: error.message };
  }
  return { events: (data ?? []) as ScheduleRow[], error: null };
}

export type ScheduleRow = {
  id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  title: string;
  notes: string;
  created_at: string;
};

function toDateString(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function getProcessPathItems() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { items: [] as ProcessRow[], error: "missing_config" as const };
  }
  const { data, error } = await supabase
    .from("process_path_items")
    .select("id, title, stage, detail, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true });
  if (error) {
    return { items: [] as ProcessRow[], error: error.message };
  }
  return { items: (data ?? []) as ProcessRow[], error: null };
}

export type ProcessRow = {
  id: string;
  title: string;
  stage: ProcessStage;
  detail: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
