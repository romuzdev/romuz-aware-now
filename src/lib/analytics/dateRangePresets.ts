import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';

export type DateRangePreset = '30d' | '90d' | 'this_month' | 'custom';

export function getDateRangeFromPreset(preset: DateRangePreset): {
  dateFrom: string;
  dateTo: string;
} {
  const today = new Date();

  switch (preset) {
    case '30d':
      return {
        dateFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      };

    case '90d':
      return {
        dateFrom: format(subDays(today, 90), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      };

    case 'this_month':
      return {
        dateFrom: format(startOfMonth(today), 'yyyy-MM-dd'),
        dateTo: format(endOfMonth(today), 'yyyy-MM-dd'),
      };

    default:
      return {
        dateFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      };
  }
}
