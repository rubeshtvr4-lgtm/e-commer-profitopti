import React from 'react';
import { Sparkles, Database } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  showSeedDemo?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  showSeedDemo = true,
}) => {
  const { seedDemoData, refreshUser } = useAuth();
  const [seeding, setSeeding] = React.useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemoData();
      await refreshUser();
      window.location.reload();
    } catch (err) {
      console.error('Failed to seed demo data', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8 shadow-sm">
      <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl mb-4 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6 max-w-sm leading-relaxed">{description}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {showSeedDemo && (
          <Button
            variant="outline"
            onClick={handleSeed}
            loading={seeding}
            icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
          >
            Seed Demo Store Data
          </Button>
        )}
      </div>
    </div>
  );
};
