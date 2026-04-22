export function getMonday(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const day = c.getDay();
  const diff = (day + 6) % 7;
  c.setDate(c.getDate() - diff);
  return c;
}

export function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
