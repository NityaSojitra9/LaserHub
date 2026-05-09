import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Add a tag...',
  maxTags = 10,
  maxTagLength = 30,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (raw: string) => {
    const value = raw.trim().toLowerCase().replace(/[^a-z0-9-_ ]/g, '').slice(0, maxTagLength);
    if (!value) return;
    if (tags.length >= maxTags) return;
    if (tags.includes(value)) return;
    onChange([...tags, value]);
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div className={`tag-input-wrapper tag-input-field ${disabled ? 'tag-input-disabled' : ''}`}>
      {tags.map(tag => (
        <span key={tag} className="tag-pill">
          {tag}
          {!disabled && (
            <button
              type="button"
              className="tag-pill-remove"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
      {!disabled && tags.length < maxTags && (
        <input
          type="text"
          className="tag-input-inner"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          maxLength={maxTagLength}
        />
      )}
      {tags.length >= maxTags && (
        <span className="tag-input-limit">Max {maxTags} tags</span>
      )}
    </div>
  );
};
