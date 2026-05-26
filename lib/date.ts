export function isoToday(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function shortDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

export function weekday(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(date));
}

export function weekDays() {
  return Array.from({ length: 7 }, (_, index) => isoToday(index));
}
