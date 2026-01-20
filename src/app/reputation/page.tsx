import { MainLayout } from '@/components/layout/MainLayout';
import { ReputationDashboard } from '@/components/business/ReputationDashboard';

export default function ReputationPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <ReputationDashboard />
      </div>
    </MainLayout>
  );
}
