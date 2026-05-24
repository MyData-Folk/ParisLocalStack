import React from 'react';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'gold';
  className?: string;
}

const colorClasses = {
  blue: 'text-blue-400 bg-blue-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  red: 'text-red-400 bg-red-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
  gold: 'text-yellow-400 bg-yellow-500/10',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'blue',
  className,
}) => {
  return (
    <div className={cn(
      'bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 card-hover fade-in',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', colorClasses[color])}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg',
            trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' :
            trend === 'down' ? 'text-red-400 bg-red-500/10' :
            'text-slate-400 bg-slate-500/10'
          )}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
