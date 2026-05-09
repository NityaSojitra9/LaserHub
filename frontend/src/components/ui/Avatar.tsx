import React, { useState } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'size'> {
  src?: string | null;
  name?: string;
  /** Preset size ("sm" | "md" | "lg" | "xl") or a pixel number. */
  size?: AvatarSize | number;
  alt?: string;
}

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  alt,
  className = '',
  ...rest
}) => {
  const [errored, setErrored] = useState(false);
  const showImg = !!src && !errored;
  const isNumeric = typeof size === 'number';
  const sizeClass = isNumeric ? '' : `ui-avatar-${size}`;
  const inlineStyle = isNumeric
    ? { width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(10, Math.round((size as number) * 0.38))}px` }
    : undefined;
  return (
    <span className={`ui-avatar ${sizeClass} ${className}`.trim()} style={inlineStyle} {...rest}>
      {showImg ? (
        <img src={src!} alt={alt || name || 'avatar'} onError={() => setErrored(true)} />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
};

export default Avatar;
