import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InputManager, MemoryStorage } from '../input';

describe('InputManager', () => {
  let manager: InputManager;

  beforeEach(() => {
    manager = new InputManager({ storage: new MemoryStorage() });
  });

  it('binds actions and emits events for keyboard input', () => {
    manager.bind('Jump', { action: 'Jump', device: 'keyboard', code: 'Space' });
    const down = vi.fn();
    const up = vi.fn();
    manager.events.on('actionDown', down);
    manager.events.on('actionUp', up);

    manager.handleKey('Space', true, 0);
    manager.handleKey('Space', false, 10);

    expect(down).toHaveBeenCalledWith({
      action: 'Jump',
      state: expect.objectContaining({ pressed: true, value: 1 }),
    });
    expect(up).toHaveBeenCalledWith({
      action: 'Jump',
      state: expect.objectContaining({ pressed: false, value: 0 }),
    });
  });

  it('rebinding replaces previous bindings and persists', () => {
    const storage = new MemoryStorage();
    manager = new InputManager({ storage });
    manager.rebind('MoveLeft', [{ action: 'MoveLeft', device: 'keyboard', code: 'ArrowLeft' }]);
    expect(manager.getBindings('MoveLeft')).toHaveLength(1);
    const persisted = storage.load();
    expect(persisted.MoveLeft?.[0].code).toBe('ArrowLeft');
  });
});
