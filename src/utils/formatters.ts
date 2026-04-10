import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format a timestamp for display in chat messages (e.g., "2:30 PM")
 */
export function formatMessageTime(timestamp: string): string {
  try {
    const date = parseISO(timestamp);
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}

/**
 * Format a relative timestamp (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(timestamp: string): string {
  try {
    const date = parseISO(timestamp);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

/**
 * Format a full date (e.g., "January 15, 2024")
 */
export function formatFullDate(timestamp: string): string {
  try {
    return format(parseISO(timestamp), 'MMMM d, yyyy');
  } catch {
    return '';
  }
}

/**
 * Format a date and time (e.g., "Jan 15, 2024 at 2:30 PM")
 */
export function formatDateTime(timestamp: string): string {
  try {
    return format(parseISO(timestamp), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return '';
  }
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a number as a currency string
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
