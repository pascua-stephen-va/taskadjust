export function parseLocalDate(dateInput: string | number | Date): Date {
  if (!dateInput && dateInput !== 0) return new Date();
  
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }

  if (typeof dateInput === 'number') {
    // Check if it looks like an Excel serial date (e.g., 40000 - 55000)
    if (dateInput > 20000 && dateInput < 80000) {
      // Excel epoch begins Dec 30, 1899 due to the 1900 leap year bug
      const excelEpoch = new Date(1899, 11, 30);
      const millisPerDay = 24 * 60 * 60 * 1000;
      const targetDate = new Date(excelEpoch.getTime() + Math.round(dateInput * millisPerDay));
      return new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    }
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? new Date() : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const dateStr = String(dateInput).trim();
  if (!dateStr) return new Date();

  // If number formatted as string
  if (/^\d{5}$/.test(dateStr)) {
    return parseLocalDate(Number(dateStr));
  }

  // Check standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(dateStr)) {
    const parts = dateStr.split('T')[0].split('-').map(Number);
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  // Check Slash format MM/DD/YYYY or YYYY/MM/DD
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/').map(Number);
    if (parts.length === 3) {
      if (parts[0] > 1900) {
        // YYYY/MM/DD
        return new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        // MM/DD/YYYY
        return new Date(parts[2], parts[0] - 1, parts[1]);
      }
    }
  }

  // Fallback to standard Date constructor
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }

  return new Date();
}

export function normalizeDateString(dateInput: any): string {
  if (!dateInput) return '';
  const parsed = parseLocalDate(dateInput);
  return formatLocalDate(parsed);
}

export function formatLocalDate(date: Date): string {
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatFriendlyDate(dateInput: string | Date): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseLocalDate(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function diffDays(start: Date, end: Date): number {
  const utc1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function networkDays(start: Date, end: Date, holidays: string[] = []): number {
  const isNegative = start > end;
  const startDate = isNegative ? new Date(end) : new Date(start);
  const endDate = isNegative ? new Date(start) : new Date(end);

  let count = 0;
  const curDate = new Date(startDate);
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateString = formatLocalDate(curDate);
    const isHoliday = holidays && holidays.length > 0 ? holidays.includes(dateString) : false;
    
    if (!isWeekend && !isHoliday) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return isNegative ? -count : count;
}
