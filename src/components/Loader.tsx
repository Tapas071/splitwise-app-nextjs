import { LoaderCircle } from 'lucide-react';

interface LoaderProps {
  label?: string;
  className?: string;
}

export function Loader({ label = 'Loading', className = '' }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`} role="status" aria-live="polite" aria-label={label}>
      <span className="relative grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <span className="absolute inset-0 rounded-2xl border border-primary/15" />
        <LoaderCircle className="size-6 animate-spin" />
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}<span className="loading-dots" aria-hidden="true">...</span></span>
    </div>
  );
}
