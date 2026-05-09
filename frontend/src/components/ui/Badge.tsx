import React from 'react';

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  className = '',
  children,
  ...rest
}) => (
  <span className={`ui-badge ui-badge-${variant} ${className}`.trim()} {...rest}>
    {icon}
    {children}
  </span>
);

export default Badge;
