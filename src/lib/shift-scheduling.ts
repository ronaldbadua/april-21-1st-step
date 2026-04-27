import type { AssignmentRole, ShiftType } from "@/lib/supabase/database.types";

/** All slot types shown in scheduling dropdowns. */
export const SLOT_TYPES: ShiftType[] = ["FHD", "BHD", "Part Time", "Vacation"];

export type AssociateLike = { id: string; shift_type: ShiftType; is_active: boolean; name?: string };

export type PoolingRuleLike = {
  associate_id: string;
  allow_sunday: boolean;
  allow_monday: boolean;
  allow_tuesday: boolean;
  allow_wednesday: boolean;
  allow_thursday: boolean;
  allow_friday: boolean;
  allow_saturday: boolean;
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

/** Pooling eligibility requires active associate, matching shift type, and day availability flag. */
export function canAssignPooling(
  associate: AssociateLike,
  rule: PoolingRuleLike | undefined,
  slotType: ShiftType,
  weekday: number
): boolean {
  if (!associate.is_active) return false;
  if (!canAssignShift(associate.shift_type, slotType, weekday)) return false;
  if (!rule) return false;
  if (weekday === 0) return rule.allow_sunday;
  if (weekday === 1) return rule.allow_monday;
  if (weekday === 2) return rule.allow_tuesday;
  if (weekday === 3) return rule.allow_wednesday;
  if (weekday === 4) return rule.allow_thursday;
  if (weekday === 5) return rule.allow_friday;
  return rule.allow_saturday;
}

export function labelForAssociate(a: AssociateLike | undefined, name: string) {
  if (!a) return "";
  return `${name} (${a.shift_type})`;
}

export function assignmentKey(date: string, role: AssignmentRole) {
  return `${date}::${role}`;
}
