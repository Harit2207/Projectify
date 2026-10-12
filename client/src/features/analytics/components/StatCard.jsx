import { Card, CardContent } from '../../../shared/components/ui/card.jsx';
import { cn } from '../../../shared/utils/cn.js';

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  highlight = false,
}) {
  return (
    <Card className={cn(highlight && 'border-destructive/50')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
              className={cn(
                'text-2xl font-semibold mt-1',
                highlight && 'text-destructive',
              )}
            >
              {value}
            </p>
          </div>
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
