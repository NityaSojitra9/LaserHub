import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ hoverable, className = '', children, ...rest }) => (
  <div
    className={`ui-card ${hoverable ? 'ui-card--hoverable' : ''} ${className}`.trim()}
    {...rest}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className={`ui-card__header ${className}`.trim()} {...rest}>
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className={`ui-card__body ${className}`.trim()} {...rest}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className={`ui-card__footer ${className}`.trim()} {...rest}>
    {children}
  </div>
);

export default Card;
