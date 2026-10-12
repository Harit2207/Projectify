export const STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
];

export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];

export const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};

export const PRIORITY_LABELS = {
  none: 'No priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const COLUMN_COLORS = {
  backlog: 'bg-slate-500',
  todo: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  in_review: 'bg-purple-500',
  done: 'bg-green-500',
};
