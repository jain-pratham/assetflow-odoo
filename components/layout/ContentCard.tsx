import { cn } from '@/lib/utils';

export function ContentCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-card/50 border border-border rounded-lg shadow-sm p-6 overflow-hidden", className)}>
      {children}
    </div>
  );
}
