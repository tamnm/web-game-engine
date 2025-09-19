import { describe, expect, it, vi } from 'vitest';
import { UIOverlay } from '..';

describe('UIOverlay', () => {
  it('attaches to DOM, adds text and panel at anchors', () => {
    const overlay = new UIOverlay();
    overlay.attach();

    const text = overlay.addText({ text: 'Hello', anchor: 'top-left', x: 10, y: 12 });
    const panel = overlay.addPanel({ title: 'Panel', anchor: 'bottom-right', x: 8, y: 6 });

    expect(document.body.contains(text)).toBe(true);
    expect(document.body.contains(panel)).toBe(true);
    expect(text.style.top).toBe('12px');
    expect(text.style.left).toBe('10px');
    expect(panel.style.bottom).toBe('6px');
    expect(panel.style.right).toBe('8px');
  });

  it('creates a button that handles clicks', () => {
    const overlay = new UIOverlay();
    overlay.attach();
    const onClick = vi.fn();
    const btn = overlay.addButton({ label: 'Click', onClick, anchor: 'center' });
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('adds image element with attributes', () => {
    const overlay = new UIOverlay();
    overlay.attach();
    const img = overlay.addImage({
      src: 'http://example.com/x.png',
      alt: 'x',
      width: 32,
      height: 16,
      anchor: 'top-right',
      x: 4,
      y: 5,
    });
    expect(img.getAttribute('src')).toContain('http://example.com/x.png');
    expect(img.alt).toBe('x');
    expect(img.width).toBe(32);
    expect(img.height).toBe(16);
    expect(img.style.top).toBe('5px');
    expect(img.style.right).toBe('4px');
  });
});
