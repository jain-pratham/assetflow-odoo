import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <PageContainer>
      <ContentCard>
        <EmptyState 
          icon={FileQuestion}
          title="404 - Page Not Found"
          description="The requested resource could not be found on the server."
        />
      </ContentCard>
    </PageContainer>
  );
}
