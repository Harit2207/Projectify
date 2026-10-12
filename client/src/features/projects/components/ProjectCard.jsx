import { MoreHorizontal, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card.jsx';
import { Button } from '../../../shared/components/ui/button.jsx';
import { Badge } from '../../../shared/components/ui/badge.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../shared/components/ui/dropdown-menu.jsx';
import { usePermission } from '../../../core/hooks/usePermission.js';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  active: 'default',
  archived: 'secondary',
  completed: 'outline',
};

export function ProjectCard({ project, onOpen, onDelete }) {
  const { hasMinRole } = usePermission();

  return (
    <Card
      className="group cursor-pointer hover:border-primary/50 transition-all"
      onClick={onOpen}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="project icon">
              {project.emoji}
            </span>
            <div>
              <p className="font-medium text-sm leading-tight">
                {project.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(project.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onClick={onOpen}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open board
              </DropdownMenuItem>
              {hasMinRole('admin') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        <Badge variant={STATUS_COLORS[project.status]} className="text-xs">
          {project.status}
        </Badge>
      </CardContent>
    </Card>
  );
}
