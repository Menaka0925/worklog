export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const MONTHS_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatDateParts(dateStr: string): {
  day: string;
  dayNumber: number;
  monthIndex: number;
  monthAbbr: string;
  monthFull: string;
  year: number;
} {
  const [y, m, d] = (dateStr || getTodayDateString()).split('-').map(Number);
  const safeYear = y || new Date().getFullYear();
  const safeMonth = (m ? m - 1 : new Date().getMonth());
  const safeDay = d || 1;
  return {
    day: String(safeDay).padStart(2, '0'),
    dayNumber: safeDay,
    monthIndex: safeMonth,
    monthAbbr: MONTHS_ABBR[safeMonth] || 'Jan',
    monthFull: MONTHS_FULL[safeMonth] || 'January',
    year: safeYear,
  };
}

export function formatDateLong(dateStr: string): string {
  const parts = formatDateParts(dateStr);
  return `${parts.day} ${parts.monthFull} ${parts.year}`;
}

export function createDateString(year: number, monthIndex: number, day: number): string {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, day), daysInMonth);
  const mStr = String(monthIndex + 1).padStart(2, '0');
  const dStr = String(safeDay).padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}


