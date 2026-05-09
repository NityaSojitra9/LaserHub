import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, containerClassName = '', className = '', id, children, ...rest }, ref) => {
    const selId = id || (label ? `ui-sel-${Math.random().toString(36).slice(2, 9)}` : undefined);
    return (
      <div className={`ui-field ${containerClassName}`.trim()}>
        {label && (
          <label className="ui-field__label" htmlFor={selId}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selId}
          className={`ui-select ${error ? 'ui-select--error' : ''} ${className}`.trim()}
          {...rest}
        >
          {children}
        </select>
        {error ? (
          <span className="ui-field__error">{error}</span>
        ) : hint ? (
          <span className="ui-field__hint">{hint}</span>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';

export default Select;
