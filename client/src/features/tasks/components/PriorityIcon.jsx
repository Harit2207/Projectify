import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../shared/utils/cn.js';

const PRIORITY_CONFIG = {
  urgent: { icon: AlertCircle, color: 'text-red-500' },
  high: { icon: ArrowUp, color: 'text-orange-500' },
  medium: { icon: ArrowRight, color: 'text-yellow-500' },
  low: { icon: ArrowDown, color: 'text-blue-400' },
  none: { icon: Minus, color: 'text-muted-foreground' },
};

export function PriorityIcon({ priority, size = 'sm' }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.none;
  const Icon = config.icon;
  const sizeClass = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return <Icon className={cn(sizeClass, config.color)} />;
}
