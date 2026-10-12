import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

export function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelative(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date) {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}
