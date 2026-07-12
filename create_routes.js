const fs = require('fs');
const path = require('path');

const routes = [
  'dashboard',
  'organization/departments',
  'organization/categories',
  'organization/employees',
  'assets/register',
  'assets/list',
  'assets/[id]',
  'assets/department',
  'assets/my',
  'allocation/allocate',
  'allocation/transfer',
  'allocation/return',
  'allocation/history',
  'allocation/transfer-requests',
  'allocation/return-requests',
  'booking/resource',
  'booking/calendar',
  'booking/requests',
  'booking/my',
  'maintenance/requests',
  'maintenance/assign-technician',
  'maintenance/history',
  'maintenance/raise',
  'maintenance/department',
  'maintenance/my',
  'audit/cycles',
  'audit/verification',
  'audit/discrepancy-reports',
  'reports/dashboard',
  'reports/assets',
  'reports/bookings',
  'reports/maintenance',
  'reports/department',
  'notifications',
  'profile'
];

const getTemplate = () => `
import { PageContainer } from '@/components/layout/PageContainer';
import { ContentCard } from '@/components/layout/ContentCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { Settings2 } from 'lucide-react';

export default function Page() {
  return (
    <PageContainer>
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
`;

const baseDir = path.join(__dirname, 'app', '(dashboard)');

routes.forEach(route => {
  const dirPath = path.join(baseDir, route);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filePath = path.join(dirPath, 'page.tsx');
  fs.writeFileSync(filePath, getTemplate().trim());
  console.log('Updated: ' + filePath);
});
