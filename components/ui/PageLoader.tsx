import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      <p className="mt-4 text-sm text-white/50 font-medium">Loading module...</p>
    </div>
  );
}
