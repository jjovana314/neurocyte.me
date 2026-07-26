// Local (not UTC) "now", formatted for the `max` attribute of date/datetime-local
// inputs so the native picker greys out future dates/times.
function localNow(): Date {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000);
}

export function todayDateString(): string {
  return localNow().toISOString().slice(0, 10);
}

export function nowDateTimeLocalString(): string {
  return localNow().toISOString().slice(0, 16);
}
