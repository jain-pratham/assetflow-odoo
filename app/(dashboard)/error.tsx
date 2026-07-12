'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { ServerCrash } from 'lucide-react';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <ContentCard>
        <EmptyState 
          icon={ServerCrash}
          title="500 - Server Error"
          description="Something went wrong while processing your request."
        />
        <div className="flex justify-center mt-4">
          <button 
            onClick={() => reset()}
            className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-md hover:bg-rose-500/20 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </ContentCard>
    </PageContainer>
  );
}
