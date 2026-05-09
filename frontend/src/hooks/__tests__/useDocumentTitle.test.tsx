import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentTitle } from '../useDocumentTitle';

function TitleProbe({ title }: { title: string }) {
  useDocumentTitle(title);
  return null;
}

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Initial Title';
  });

  it('sets document.title while mounted', () => {
    render(<TitleProbe title="Foo — LaserHub" />);
    expect(document.title).toBe('Foo — LaserHub');
  });

  it('restores the previous document.title on unmount', () => {
    const previous = 'Initial Title';
    expect(document.title).toBe(previous);

    const { unmount } = render(<TitleProbe title="Foo — LaserHub" />);
    expect(document.title).toBe('Foo — LaserHub');

    unmount();
    expect(document.title).toBe(previous);
  });

  it('updates document.title when the title prop changes', () => {
    const { rerender } = render(<TitleProbe title="Foo — LaserHub" />);
    expect(document.title).toBe('Foo — LaserHub');

    rerender(<TitleProbe title="Bar — LaserHub" />);
    expect(document.title).toBe('Bar — LaserHub');
  });
});
