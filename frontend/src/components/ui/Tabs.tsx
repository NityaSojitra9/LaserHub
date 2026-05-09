import React, { useCallback, useId, useRef, useState } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultId?: string;
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
  'aria-label'?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultId,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Tabs',
}) => {
  const uid = useId();
  const [internal, setInternal] = useState<string>(defaultId || items[0]?.id || '');
  const active = value ?? internal;
  const listRef = useRef<HTMLDivElement>(null);

  const select = useCallback(
    (id: string) => {
      if (value === undefined) setInternal(id);
      onChange?.(id);
    },
    [onChange, value]
  );

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End')
      return;
    e.preventDefault();
    const enabled = items.filter((it) => !it.disabled);
    if (enabled.length === 0) return;
    const curIdx = enabled.findIndex((it) => it.id === items[index].id);
    let nextIdx = curIdx;
    if (e.key === 'ArrowRight') nextIdx = (curIdx + 1) % enabled.length;
    if (e.key === 'ArrowLeft') nextIdx = (curIdx - 1 + enabled.length) % enabled.length;
    if (e.key === 'Home') nextIdx = 0;
    if (e.key === 'End') nextIdx = enabled.length - 1;
    const nextId = enabled[nextIdx].id;
    select(nextId);
    const btn = listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${nextId}"]`);
    btn?.focus();
  };

  const current = items.find((it) => it.id === active) || items[0];

  return (
    <div className={`ui-tabs ${className}`.trim()}>
      <div
        className="ui-tabs__list"
        role="tablist"
        aria-label={ariaLabel}
        ref={listRef}
      >
        {items.map((it, i) => {
          const selected = it.id === active;
          return (
            <button
              key={it.id}
              type="button"
              role="tab"
              id={`${uid}-tab-${it.id}`}
              data-tab-id={it.id}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${it.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={it.disabled}
              onClick={() => !it.disabled && select(it.id)}
              onKeyDown={(e) => onKey(e, i)}
              className="ui-tabs__trigger"
            >
              {it.label}
            </button>
          );
        })}
      </div>
      {current && (
        <div
          key={current.id}
          role="tabpanel"
          id={`${uid}-panel-${current.id}`}
          aria-labelledby={`${uid}-tab-${current.id}`}
          className="ui-tabs__panel"
          tabIndex={0}
        >
          {current.content}
        </div>
      )}
    </div>
  );
};

export default Tabs;
