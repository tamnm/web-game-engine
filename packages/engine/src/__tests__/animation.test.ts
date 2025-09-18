import { describe, expect, it, vi } from 'vitest';
import { Tween } from '../animation';
import { Easings } from '../animation/easing';

describe('Tween', () => {
  it('interpolates numeric values over time', () => {
    const updates: number[] = [];
    const tween = new Tween<number>({
      from: 0,
      to: 10,
      duration: 1000,
      easing: Easings.linear,
      onUpdate: (value) => updates.push(value),
    });

    tween.start();
    tween.update(500);
    tween.update(500);

    expect(updates.at(-1)).toBeCloseTo(10);
  });

  it('invokes completion callback', () => {
    const onComplete = vi.fn();
    const tween = new Tween<number>({ from: 0, to: 1, duration: 100, onComplete });
    tween.start();
    tween.update(200);
    expect(onComplete).toHaveBeenCalled();
  });
});
