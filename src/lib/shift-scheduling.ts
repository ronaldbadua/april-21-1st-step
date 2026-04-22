import type { AssignmentRole, ShiftType } from "@/lib/supabase/database.types";

/** All slot types shown in scheduling dropdowns. */
export const SLOT_TYPES: ShiftType[] = ["FHD", "BHD", "Part Time", "Vacation"];

export type AssociateLike = { id: string; shift_type: ShiftType; is_active: boolean; name?: string };

export type PoolingRuleLike = {
  associate_id: string;
  allow_sun_wed_band: boolean;
  allow_wed_sat_band: boolean;
  allow_weekend_part_time: boolean;
  is_ineligible: boolean;
};

/**
 * Default slot type for a calendar day (used before a row exists, and as auto-assign pattern).
 * Weekends → Part Time; weekdays alternate FHD/BHD by day-of-month.
 */
export function defaultSlotTypeForDate(ymd: string): ShiftType {
  const [y, m, d] = ymd.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  if (wd === 0 || wd === 6) return "Part Time";
  return d % 2 === 0 ? "FHD" : "BHD";
}

export function weekdayFromYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Whether an associate's contract type can fill a slot on that weekday. */
export function canAssignShift(associateShift: ShiftType, slotType: ShiftType, weekday: number): boolean {
  if (slotType === "Vacation") return false;
  if (associateShift === "Vacation") return false;
  if (slotType === "Part Time") {
    return associateShift === "Part Time" && (weekday === 0 || weekday === 6);
  }
  return associateShift === slotType;
}

/** Pooling tab: same shift rules plus band flags (mirrors your Pooling Rules screen). */
export function canAssignPooling(
  associate: AssociateLike,
  rule: PoolingRuleLike | undefined,
  slotType: ShiftType,
  weekday: number
): boolean {
  if (!associate.is_active) return false;
  if (!canAssignShift(associate.shift_type, slotType, weekday)) return false;
  if (rule?.is_ineligible) return false;
  if (!rule) return false;
  if (slotType === "Part Time") return rule.allow_weekend_part_time;
  if (weekday <= 3) return rule.allow_sun_wed_band;
  return rule.allow_wed_sat_band;
}

export function labelForAssociate(a: AssociateLike | undefined, name: string) {
  if (!a) return "";
  return `${name} (${a.shift_type})`;
}

export function assignmentKey(date: string, role: AssignmentRole) {
  return `${date}::${role}`;
}
