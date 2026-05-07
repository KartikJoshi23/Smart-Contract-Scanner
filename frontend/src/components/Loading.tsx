import { Card } from '@/components/ui/card';
import { Shield, FileSearch, Scan, Brain, FileCheck } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

const Loading = ({ message = 'Analyzing contract...' }: LoadingProps) => {
  const steps = [
    { icon: FileSearch, label: 'Parsing' },
    { icon: Scan, label: 'Scanning' },
    { icon: Brain, label: 'AI Analysis' },
    { icon: FileCheck, label: 'Report' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-2 border-muted" />
        <div 
          className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{message}</h3>
      <p className="text-muted-foreground text-sm mb-10">This may take 1-3 minutes</p>

      {/* Steps */}
      <div className="flex items-center gap-6">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex flex-col items-center gap-2">
              <Card 
                className="w-12 h-12 flex items-center justify-center bg-card border-border animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <Icon className="w-5 h-5 text-blue-500" />
              </Card>
              <span className="text-xs text-muted-foreground">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Loading;