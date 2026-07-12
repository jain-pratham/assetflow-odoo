import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { Settings2 } from 'lucide-react';

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Department Reports" />
      <ContentCard>
        <EmptyState 
          icon={Settings2}
          title="Implementation Pending" 
          description="This module will be implemented in the next phase."
        />
      </ContentCard>
    </PageContainer>
  );
}