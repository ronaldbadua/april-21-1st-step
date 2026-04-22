import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listDatabaseEntries, type DatabaseEntryRow } from "@/lib/services/database-entries";
import type { AssignmentRole, HourlyNoteStatus, ProcessStage, ShiftType } from "@/lib/supabase/database.types";
import { monthBounds, monthDays } from "@/lib/week";

export type { DatabaseEntryRow };

export type AssociateRow = {
  id: string;
  name: string;
  shift_type: ShiftType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PoolingRuleRow = {
  id: string;
  associate_id: string;
  allow_sun_wed_band: boolean;
  allow_wed_sat_band: boolean;
  allow_weekend_part_time: boolean;
  is_ineligible: boolean;
  created_at: string;
  updated_at: string;
};

export type MonthlyAssignmentRow = {
  id: string;
  assignment_date: string;
  role: AssignmentRole;
  slot_type: ShiftType;
  associate_id: string | null;
  created_at: string;
  updated_at: string;
};

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

export async function getDatabaseEntries() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { entries: [] as DatabaseEntryRow[], error: "missing_config" as const };
  }
  const { data, error } = await listDatabaseEntries(supabase);
  if (error) {
    return { entries: [] as DatabaseEntryRow[], error };
  }
  return { entries: data, error: null };
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

export async function getSchedulingData(ym: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      associates: [] as AssociateRow[],
      rules: [] as PoolingRuleRow[],
      assignments: [] as MonthlyAssignmentRow[],
      monthDays: monthDays(ym),
      error: "missing_config" as const,
    };
  }

  const { start, end } = monthBounds(ym);
  const [associatesRes, rulesRes, assignmentsRes] = await Promise.all([
    supabase.from("associates").select("id, name, shift_type, is_active, created_at, updated_at").order("name", { ascending: true }),
    supabase.from("pooling_rules").select("id, associate_id, allow_sun_wed_band, allow_wed_sat_band, allow_weekend_part_time, is_ineligible, created_at, updated_at"),
    supabase
      .from("monthly_assignments")
      .select("id, assignment_date, role, slot_type, associate_id, created_at, updated_at")
      .gte("assignment_date", start)
      .lte("assignment_date", end),
  ]);

  const error = associatesRes.error ?? rulesRes.error ?? assignmentsRes.error;
  if (error) {
    return {
      associates: [] as AssociateRow[],
      rules: [] as PoolingRuleRow[],
      assignments: [] as MonthlyAssignmentRow[],
      monthDays: monthDays(ym),
      error: error.message,
    };
  }

  return {
    associates: (associatesRes.data ?? []) as AssociateRow[],
    rules: (rulesRes.data ?? []) as PoolingRuleRow[],
    assignments: (assignmentsRes.data ?? []) as MonthlyAssignmentRow[],
    monthDays: monthDays(ym),
    error: null,
  };
}
