import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`ui-empty-state ${className}`.trim()}>
    {icon && <div className="ui-empty-state__icon">{icon}</div>}
    <h3 className="ui-empty-state__title">{title}</h3>
    {description && <p className="ui-empty-state__description">{description}</p>}
    {action && <div className="ui-empty-state__action">{action}</div>}
  </div>
);

export default EmptyState;
