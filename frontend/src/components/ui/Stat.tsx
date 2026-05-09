import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'flat';

interface StatProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    direction: TrendDirection;
    value: string;
  };
  className?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, icon, trend, className = '' }) => (
  <div className={`ui-stat ${className}`.trim()}>
    <div className="ui-stat__head">
      <span className="ui-stat__label">{label}</span>
      {icon && <span className="ui-stat__icon">{icon}</span>}
    </div>
    <div className="ui-stat__value">{value}</div>
    {trend && (
      <span className={`ui-stat__trend ui-stat__trend--${trend.direction}`}>
        {trend.direction === 'up' && <ArrowUpRight size={14} />}
        {trend.direction === 'down' && <ArrowDownRight size={14} />}
        {trend.direction === 'flat' && <Minus size={14} />}
        {trend.value}
      </span>
    )}
  </div>
);

export default Stat;
