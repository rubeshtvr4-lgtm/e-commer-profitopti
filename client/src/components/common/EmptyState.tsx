import React from 'react';
import { Sparkles } from 'lucide-react';
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
    <div className="bg-white border border-[#E7E9ED] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="w-14 h-14 rounded-2xl bg-[#EAF5F0] border border-[#D2ECE1] text-[#176B57] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#17191C] tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-[#737983] mt-1.5 mb-6 max-w-sm leading-relaxed">{description}</p>

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
            icon={<Sparkles className="w-3.5 h-3.5 text-[#176B57]" />}
          >
            Seed Demo Store Data
          </Button>
        )}
      </div>
    </div>
  );
};
