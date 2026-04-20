import { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-8 rounded-md border border-dashed border-border bg-surface">
      {icon && <div className="mb-4 grid place-items-center mx-auto w-12 h-12 rounded-md bg-secondary text-muted-foreground">{icon}</div>}
      <h3 className="text-headline-md mb-1">{title}</h3>
      {description && <p className="text-muted-foreground text-body mb-6 max-w-md mx-auto">{description}</p>}
      {action}
    </div>
  );
}
