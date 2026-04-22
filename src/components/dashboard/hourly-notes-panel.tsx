"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { upsertHourlyNote, deleteHourlyNote } from "@/app/actions/hourly-notes";
import type { HourlyNoteStatus } from "@/lib/supabase/database.types";
import { HOURLY_NOTES_HOUR_END, HOURLY_NOTES_HOUR_START } from "@/lib/constants";
import { buildHourlySlots, summarizeHourlyStatus, type HourlySlot } from "@/lib/hourly-notes-logic";
import { ConfigBanner } from "@/components/dashboard/config-banner";
import { FormLabel, HourlyRowStatusBadge, StatusPill } from "@/components/dashboard/status-pill";

function formatHourLabel(h: number): string {
  const d = new Date(2000, 0, 1, h, 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface HourlyNotesPanelProps {
  initialDate: string;
  rows: {
    id: string;
    hour: number;
    status: HourlyNoteStatus;
    content: string;
    author_name: string;
  }[];
  hasSupabase: boolean;
}

export function HourlyNotesPanel({ initialDate, rows, hasSupabase }: HourlyNotesPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [formByHour, setFormByHour] = useState<Record<number, { content: string; author: string; status: HourlyNoteStatus }>>(
    {}
  );

  const dateValue = searchParams.get("date") ?? initialDate;

  const slots = useMemo(
    () => buildHourlySlots(dateValue, rows, HOURLY_NOTES_HOUR_START, HOURLY_NOTES_HOUR_END),
    [dateValue, rows]
  );
  const summary = useMemo(() => summarizeHourlyStatus(slots), [slots]);

  const onView = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d = String(fd.get("date") || "");
    if (!d) return;
    setError(null);
    router.push(`/hourly-notes?date=${encodeURIComponent(d)}`);
  };

  const ensureForm = (slot: HourlySlot) => {
    if (formByHour[slot.hour]) return;
    setFormByHour((prev) => ({
      ...prev,
      [slot.hour]: {
        content: slot.content,
        author: slot.author_name,
        status: slot.status,
      },
    }));
  };

  const saveSlot = (slot: HourlySlot) => {
    const f = formByHour[slot.hour] ?? {
      content: slot.content,
      author: slot.author_name,
      status: slot.status,
    };
    if (!hasSupabase) {
      setError("Configure Supabase to save notes.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await upsertHourlyNote(dateValue, slot.hour, {
        content: f.content,
        author_name: f.author,
        status: f.status,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const clearSlot = (hour: number) => {
    if (!hasSupabase) {
      setError("Configure Supabase to delete saved rows.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteHourlyNote(dateValue, hour);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFormByHour((prev) => {
        const next = { ...prev };
        delete next[hour];
        return next;
      });
      setExpanded((e) => (e === hour ? null : e));
      router.refresh();
    });
  };

  return (
    <div>
      {!hasSupabase ? <ConfigBanner /> : null}
      {error ? (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200/80 px-5 py-4 md:flex md:items-start md:justify-between md:gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hourly Notes</h3>
            <p className="text-sm text-slate-500">Track concerns per hour with clear status highlights.</p>
          </div>
          <form
            onSubmit={onView}
            className="mt-3 flex w-full max-w-sm flex-col gap-2 sm:mt-0 sm:flex-row sm:items-end sm:gap-2 md:max-w-none"
          >
            <div className="w-full min-w-0 sm:w-44">
              <FormLabel>Date</FormLabel>
              <div className="flex rounded-lg border border-slate-200 bg-slate-50/80 focus-within:ring-2 focus-within:ring-sky-500/30">
                <input
                  name="date"
                  type="date"
                  defaultValue={dateValue}
                  className="w-full rounded-lg bg-transparent px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="h-[42px] rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              View
            </button>
          </form>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill label="Resolved" value={summary.resolved} tone="success" />
            <StatusPill label="Pending" value={summary.pending} tone="warning" />
            <StatusPill label="Needs Attention" value={summary.needsAttention} tone="danger" />
            <StatusPill label="Total Logged" value={summary.totalLogged} tone="neutral" />
          </div>
        </div>

        <ul className="divide-y divide-slate-200/80 border-t border-slate-200/80">
          {slots.map((slot) => {
            const isOpen = expanded === slot.hour;
            const rowTone =
              slot.status === "resolved"
                ? "bg-emerald-50/50"
                : slot.status === "needs_attention"
                  ? "bg-rose-50/50"
                  : "bg-amber-50/60";
            return (
              <li key={slot.hour} className={rowTone}>
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-[5.5rem] text-sm font-semibold text-slate-800">
                      {formatHourLabel(slot.hour)}
                    </span>
                    <HourlyRowStatusBadge status={slot.status} />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      setError(null);
                      if (!isOpen) {
                        ensureForm(slot);
                      }
                      setExpanded(isOpen ? null : slot.hour);
                    }}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? "Collapse" : "Expand"}
                    <span className="text-slate-400" aria-hidden>
                      {isOpen ? "▴" : "▾"}
                    </span>
                  </button>
                </div>
                {isOpen ? (
                  <div className="border-t border-slate-200/60 bg-white/90 px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <FormLabel>Status</FormLabel>
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                          value={(formByHour[slot.hour] ?? { status: slot.status, content: slot.content, author: slot.author_name }).status}
                          onChange={(e) => {
                            const v = e.target.value as HourlyNoteStatus;
                            ensureForm(slot);
                            setFormByHour((prev) => ({
                              ...prev,
                              [slot.hour]: { ...(prev[slot.hour] ?? { content: slot.content, author: slot.author_name, status: slot.status }), status: v },
                            }));
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="needs_attention">Needs attention</option>
                        </select>
                      </div>
                      <div>
                        <FormLabel>Author</FormLabel>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                          value={(formByHour[slot.hour] ?? { content: slot.content, author: slot.author_name, status: slot.status }).author}
                          onChange={(e) => {
                            ensureForm(slot);
                            setFormByHour((prev) => ({
                              ...prev,
                              [slot.hour]: { ...(prev[slot.hour] ?? { content: slot.content, author: slot.author_name, status: slot.status }), author: e.target.value },
                            }));
                          }}
                          placeholder="Name or role"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <FormLabel>Feedback or concern</FormLabel>
                      <textarea
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        value={(formByHour[slot.hour] ?? { content: slot.content, author: slot.author_name, status: slot.status }).content}
                        onChange={(e) => {
                          ensureForm(slot);
                          setFormByHour((prev) => ({
                            ...prev,
                            [slot.hour]: { ...(prev[slot.hour] ?? { content: slot.content, author: slot.author_name, status: slot.status }), content: e.target.value },
                          }));
                        }}
                        placeholder="Capture hourly associate feedback, concerns, and follow-ups…"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                      {slot.hasPersistedRow ? (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          onClick={() => clearSlot(slot.hour)}
                          disabled={pending}
                        >
                          Clear saved note
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                        onClick={() => saveSlot(slot)}
                        disabled={pending}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
