import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, containerClassName = '', className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? `ui-input-${Math.random().toString(36).slice(2, 9)}` : undefined);
    return (
      <div className={`ui-field ${containerClassName}`.trim()}>
        {label && (
          <label className="ui-field__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`.trim()}
          {...rest}
        />
        {error ? (
          <span className="ui-field__error">{error}</span>
        ) : hint ? (
          <span className="ui-field__hint">{hint}</span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
