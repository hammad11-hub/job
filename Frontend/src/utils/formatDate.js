import { formatDistanceToNow, format } from 'date-fns';

export const formatDate = (date, variant = 'distance') => {
  if (!date) return '-';
  const d = new Date(date);
  if (variant === 'distance') {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  return format(d, 'MMM d, yyyy');
};
