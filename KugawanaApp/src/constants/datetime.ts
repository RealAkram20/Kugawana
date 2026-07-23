/**
 * Splits a timestamp into the parts the UI needs to render a deadline like
 * "Today, 8:00 PM". The day is returned as a translation key rather than a
 * string so the caller can localise it; only an absolute date falls back to
 * the platform formatter.
 */
export function availableUntilParts(iso: string, locale: string) {
  const target = new Date(iso)

  if (Number.isNaN(target.getTime())) {
    return { dayKey: null as 'today' | 'tomorrow' | null, day: '', time: '' }
  }

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

  const time = target.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })

  if (sameDay(target, now)) return { dayKey: 'today' as const, day: '', time }
  if (sameDay(target, tomorrow)) return { dayKey: 'tomorrow' as const, day: '', time }

  return {
    dayKey: null,
    day: target.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    time,
  }
}
