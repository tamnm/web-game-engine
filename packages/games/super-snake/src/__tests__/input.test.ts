import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { MemoryStorage } from '@web-game-engine/core';
import { SuperSnakeInput } from '../game';

describe('SuperSnakeInput', () => {
  let canvas: HTMLCanvasElement;
  let storage: MemoryStorage;
  let input: SuperSnakeInput;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    storage = new MemoryStorage();
    input = new SuperSnakeInput({ storage });
    input.attach(canvas);
  });

  afterEach(() => {
    input.detach();
    document.body.innerHTML = '';
  });

  it('queues directions from keyboard', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp', bubbles: true }));
    const direction = input.consumeDirection();
    expect(direction).toBe('up');

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowUp', bubbles: true }));
    expect(input.consumeDirection()).toBeNull();
  });

  it('supports rebinding and persists bindings', () => {
    input.rebind('move-up', [{ action: 'move-up', device: 'keyboard', code: 'KeyI' }]);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyI', bubbles: true }));
    expect(input.consumeDirection()).toBe('up');

    const persisted = storage.load();
    expect(persisted['move-up'].some((binding) => binding.code === 'KeyI')).toBe(true);
  });

  it('detects swipe gestures as directions', () => {
    if (typeof PointerEvent === 'undefined') {
      // jsdom before Node 18 may not support PointerEvent; skip gracefully
      return;
    }
    const down = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      pointerType: 'touch',
      bubbles: true,
    });
    canvas.dispatchEvent(down);

    const up = new PointerEvent('pointerup', {
      pointerId: 1,
      clientX: 10,
      clientY: 80,
      pointerType: 'touch',
      bubbles: true,
    });
    canvas.dispatchEvent(up);

    expect(input.consumeDirection()).toBe('down');
  });

  it('polls gamepad buttons and axes', () => {
    input.detach();
    const buttonState = { pressed: true, value: 1 }; // minimal stub
    const navigatorStub = {
      getGamepads: vi.fn(() => [
        {
          index: 0,
          buttons: Array.from({ length: 16 }, (_, idx) =>
            idx === 12 ? buttonState : { pressed: false, value: 0 }
          ),
          axes: [0.6, 0],
        } as unknown as Gamepad,
      ]),
    } as unknown as Navigator;

    const gamepadInput = new SuperSnakeInput({ storage, navigator: navigatorStub });
    gamepadInput.attach(canvas);
    gamepadInput.update();
    expect(gamepadInput.consumeDirection()).toBe('up');
    expect(gamepadInput.consumeDirection()).toBe('right');
    gamepadInput.detach();
  });
});
