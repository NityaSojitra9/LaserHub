import React from 'react';
import { Link } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  href?: string;
  /** Alias for href, kept for compatibility with react-router-style usage. */
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
  className = '',
}) => (
  <header className={`ui-page-header ${className}`.trim()}>
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav className="ui-page-header__crumbs" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <span className="ui-page-header__crumbs-sep">/</span>}
            {crumb.to || crumb.href ? (
              <Link to={crumb.to ?? crumb.href ?? '#'}>{crumb.label}</Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    )}
    <div className="ui-page-header__top">
      <div>
        <h1 className="ui-page-header__title">{title}</h1>
        {subtitle && <p className="ui-page-header__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="ui-page-header__action">{action}</div>}
    </div>
  </header>
);

export default PageHeader;
