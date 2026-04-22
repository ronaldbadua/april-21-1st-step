"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createScheduleEvent, deleteScheduleEvent, updateScheduleEvent } from "@/app/actions/scheduling";
import type { ScheduleRow } from "@/lib/data/queries";
import { addDays, getMonday, toYmd } from "@/lib/week";
import { ConfigBanner } from "@/components/dashboard/config-banner";
import { FormLabel } from "@/components/dashboard/status-pill";

function parseYmd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function SchedulingPanel({
  weekStartYmd,
  events,
  hasSupabase,
  queryError,
}: {
  weekStartYmd: string;
  events: ScheduleRow[];
  hasSupabase: boolean;
  queryError: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ScheduleRow | null>(null);

  const week = useMemo(() => {
    const start = parseYmd(weekStartYmd);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekStartYmd]);

  const byDate = useMemo(() => {
    const m = new Map<string, ScheduleRow[]>();
    for (const e of events) {
      const list = m.get(e.event_date) ?? [];
      list.push(e);
      m.set(e.event_date, list);
    }
    for (const [k, v] of m) {
      v.sort((a, b) => a.start_time.localeCompare(b.start_time));
      m.set(k, v);
    }
    return m;
  }, [events]);

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasSupabase) {
      setError("Configure Supabase to create events.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const event_date = String(fd.get("event_date") || "");
    const start_time = String(fd.get("start_time") || "");
    const end_time = String(fd.get("end_time") || "");
    const title = String(fd.get("title") || "");
    const notes = String(fd.get("notes") || "");
    setError(null);
    startTransition(async () => {
      const res = await createScheduleEvent({ event_date, start_time, end_time, title, notes });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  };

  const onUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    if (!hasSupabase) {
      setError("Configure Supabase to update events.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const event_date = String(fd.get("event_date") || "");
    const start_time = String(fd.get("start_time") || "");
    const end_time = String(fd.get("end_time") || "");
    const title = String(fd.get("title") || "");
    const notes = String(fd.get("notes") || "");
    setError(null);
    startTransition(async () => {
      const res = await updateScheduleEvent(editing.id, { event_date, start_time, end_time, title, notes });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  };

  const onDelete = (id: string) => {
    if (!hasSupabase) {
      setError("Configure Supabase to delete events.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteScheduleEvent(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (editing?.id === id) setEditing(null);
      router.refresh();
    });
  };

  const shiftWeek = (dir: -1 | 1) => {
    const d = addDays(parseYmd(weekStartYmd), dir * 7);
    router.push(`/scheduling?week=${encodeURIComponent(toYmd(d))}`);
  };

  return (
    <div>
      {!hasSupabase ? <ConfigBanner /> : null}
      {queryError && queryError !== "missing_config" ? (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {queryError}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">Week of {parseYmd(weekStartYmd).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => shiftWeek(-1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => shiftWeek(1)}
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {week.map((day) => {
            const ymd = toYmd(day);
            const list = byDate.get(ymd) ?? [];
            return (
              <div key={ymd} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <div className="border-b border-slate-200/80 px-4 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {day.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="divide-y divide-slate-200/60">
                  {list.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-500">No events scheduled.</p>
                  ) : (
                    list.map((ev) => (
                      <div key={ev.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                          <p className="text-xs text-slate-500">
                            {ev.start_time.slice(0, 5)} – {ev.end_time.slice(0, 5)}
                          </p>
                          {ev.notes ? <p className="mt-1 text-sm text-slate-600">{ev.notes}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-sm font-medium text-sky-700 hover:underline"
                            onClick={() => setEditing(ev)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-rose-600 hover:underline"
                            onClick={() => onDelete(ev.id)}
                            disabled={pending}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-fit space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">New event</h3>
            <form onSubmit={onCreate} className="mt-3 space-y-3">
              <div>
                <FormLabel>Date</FormLabel>
                <input
                  name="event_date"
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                  defaultValue={weekStartYmd}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FormLabel>Start</FormLabel>
                  <input name="start_time" type="time" required className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" />
                </div>
                <div>
                  <FormLabel>End</FormLabel>
                  <input name="end_time" type="time" required className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" />
                </div>
              </div>
              <div>
                <FormLabel>Title</FormLabel>
                <input name="title" required className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </div>
              <div>
                <FormLabel>Notes</FormLabel>
                <textarea name="notes" rows={3} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  disabled={pending}
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          {editing ? (
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Edit event</h3>
              <form key={editing.id} onSubmit={onUpdate} className="mt-3 space-y-3">
                <div>
                  <FormLabel>Date</FormLabel>
                  <input
                    name="event_date"
                    type="date"
                    required
                    className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                    defaultValue={editing.event_date}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FormLabel>Start</FormLabel>
                    <input
                      name="start_time"
                      type="time"
                      required
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                      defaultValue={editing.start_time.slice(0, 5)}
                    />
                  </div>
                  <div>
                    <FormLabel>End</FormLabel>
                    <input
                      name="end_time"
                      type="time"
                      required
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                      defaultValue={editing.end_time.slice(0, 5)}
                    />
                  </div>
                </div>
                <div>
                  <FormLabel>Title</FormLabel>
                  <input
                    name="title"
                    required
                    className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                    defaultValue={editing.title}
                  />
                </div>
                <div>
                  <FormLabel>Notes</FormLabel>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
                    defaultValue={editing.notes}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    disabled={pending}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function defaultWeekParam(): string {
  return toYmd(getMonday(new Date()));
}
