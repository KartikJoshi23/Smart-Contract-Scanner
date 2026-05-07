import { type Severity } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, ShieldCheck } from 'lucide-react';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
}

const SeverityBadge = ({ severity, size = 'md' }: SeverityBadgeProps) => {
  const config: Record<Severity, { bg: string; text: string; icon: typeof AlertOctagon }> = {
    critical: { bg: 'bg-red-500/15 border-red-500/30 hover:bg-red-500/20', text: 'text-red-400', icon: AlertOctagon },
    high: { bg: 'bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/20', text: 'text-orange-400', icon: AlertTriangle },
    medium: { bg: 'bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/20', text: 'text-amber-400', icon: AlertCircle },
    low: { bg: 'bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/20', text: 'text-blue-400', icon: Info },
    info: { bg: 'bg-slate-500/15 border-slate-500/30 hover:bg-slate-500/20', text: 'text-slate-400', icon: ShieldCheck },
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const { bg, text, icon: Icon } = config[severity];

  return (
    <Badge variant="outline" className={`${bg} ${text} ${sizes[size]} font-semibold uppercase border`}>
      <Icon className={iconSizes[size]} />
      {severity}
    </Badge>
  );
};

export default SeverityBadge;