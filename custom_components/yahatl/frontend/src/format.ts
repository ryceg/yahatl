/**
 * Shared due-date formatting for card rows (queue / list / my-tasks).
 *
 * Classification happens on LOCAL calendar days, not raw millisecond
 * differences: an item due at 9:00 reads "Overdue 3h" at noon the same day
 * instead of jumping straight to "Overdue 1d".
 */
export function formatDue(
  due: string | null
): { label: string; className: string } | null {
  if (!due) return null;
  const d = new Date(due);
  if (isNaN(d.getTime())) return null;
  const now = new Date();

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  // Whole-day difference on local calendar-day boundaries. Math.round guards
  // against DST days being 23 or 25 hours long.
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86400000);

  if (dayDiff < 0) {
    return { label: `Overdue ${-dayDiff}d`, className: "overdue" };
  }
  if (dayDiff === 0) {
    if (d.getTime() < now.getTime()) {
      const hours = Math.floor((now.getTime() - d.getTime()) / 3600000);
      return {
        label: hours >= 1 ? `Overdue ${hours}h` : "Overdue",
        className: "overdue",
      };
    }
    return { label: "Today", className: "due-today" };
  }
  if (dayDiff === 1) return { label: "Tomorrow", className: "" };
  return { label: d.toLocaleDateString(), className: "" };
}
