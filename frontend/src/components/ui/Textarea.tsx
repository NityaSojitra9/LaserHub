import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, containerClassName = '', className = '', id, ...rest }, ref) => {
    const taId = id || (label ? `ui-ta-${Math.random().toString(36).slice(2, 9)}` : undefined);
    return (
      <div className={`ui-field ${containerClassName}`.trim()}>
        {label && (
          <label className="ui-field__label" htmlFor={taId}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          className={`ui-textarea ${error ? 'ui-textarea--error' : ''} ${className}`.trim()}
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
Textarea.displayName = 'Textarea';

export default Textarea;
