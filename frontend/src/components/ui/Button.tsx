import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconRight,
  fullWidth,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={`ui-btn ui-btn-${variant} ui-btn-${size} ${fullWidth ? 'ui-btn-full' : ''} ${className}`.trim()}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <Loader2 size={16} className="ui-btn-spin" /> : icon}
    {children && <span>{children}</span>}
    {iconRight}
  </button>
);

export default Button;
