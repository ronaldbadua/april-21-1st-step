import { Suspense } from "react";
import { PageHero } from "@/components/dashboard/page-hero";
import { HourlyNotesPanel } from "@/components/dashboard/hourly-notes-panel";
import { toDateStringLocal } from "@/lib/hourly-notes-logic";
import { getHourlyNotesForDate, isSupabaseConfigured } from "@/lib/data/queries";

function defaultDate() {
  return toDateStringLocal(new Date());
}

function PanelFallback() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">Loading hourly notes…</p>
    </div>
  );
}

export default async function HourlyNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : defaultDate();
  const { rows, error } = await getHourlyNotesForDate(date);
  const hasConfig = isSupabaseConfigured();

  return (
    <>
      <PageHero
        kicker="Hourly Associate Feedback and Concern"
        title="ICQA Dashboard"
        pill="Hourly Notes"
      />
      {error && error !== "missing_config" ? (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      <Suspense fallback={<PanelFallback />}>
        <HourlyNotesPanel
          key={date}
          initialDate={date}
          rows={rows}
          hasSupabase={hasConfig && error !== "missing_config"}
        />
      </Suspense>
    </>
  );
}
