import { PageHero } from "@/components/dashboard/page-hero";
import { defaultWeekParam, SchedulingPanel } from "@/components/dashboard/scheduling-panel";
import { getScheduleEvents, isSupabaseConfigured } from "@/lib/data/queries";

function isYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function SchedulingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const week = sp.week && isYmd(sp.week) ? sp.week : defaultWeekParam();
  const { events, error } = await getScheduleEvents(week);
  const hasConfig = isSupabaseConfigured();

  return (
    <>
      <PageHero kicker="Shifts, touchpoints, and follow-ups" title="ICQA Dashboard" pill="Scheduling" />
      <SchedulingPanel
        key={week}
        weekStartYmd={week}
        events={events}
        hasSupabase={hasConfig && error !== "missing_config"}
        queryError={error && error !== "missing_config" ? error : null}
      />
    </>
  );
}
