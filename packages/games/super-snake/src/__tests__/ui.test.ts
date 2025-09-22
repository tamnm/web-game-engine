import { describe, expect, it, vi } from 'vitest';
import { SuperSnakeUI, LeaderboardStorage } from '../game';

describe('SuperSnakeUI', () => {
  it('navigates between menus and emits start events', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ui = new SuperSnakeUI({ container });

    const startSpy = vi.fn();
    ui.on('start', startSpy);

    ui.setState('mode-select');
    const startButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Classic')
    );
    expect(startButton).toBeTruthy();
    startButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(startSpy).toHaveBeenCalledWith({ mode: 'classic' });
    ui.dispose();
    document.body.innerHTML = '';
  });

  it('shows coming soon message for unavailable modes', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ui = new SuperSnakeUI({ container });
    ui.setState('mode-select');

    const timedButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Timed')
    );
    expect(timedButton).toBeTruthy();
    timedButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(container.textContent).toContain('Timed mode is coming soon');
    ui.dispose();
    document.body.innerHTML = '';
  });

  it('renders live HUD while playing and updates with score changes', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ui = new SuperSnakeUI({ container });

    ui.setHudStats({ score: 12, combo: 2 });
    ui.setState('playing');

    const hud = container.querySelector('[data-testid="super-snake-hud"]') as HTMLDivElement | null;
    expect(hud).toBeTruthy();
    expect(hud?.textContent).toContain('Score 12');
    expect(hud?.textContent).toContain('Combo x2');

    ui.setHudStats({ score: 28, combo: 5 });
    expect(hud?.textContent).toContain('Score 28');
    expect(hud?.textContent).toContain('Combo x5');

    ui.setHudStats(null);
    expect(container.querySelector('[data-testid="super-snake-hud"]')).toBeNull();

    ui.dispose();
    document.body.innerHTML = '';
  });
});

describe('LeaderboardStorage', () => {
  it('orders entries by score and combo', () => {
    const backing: Record<string, string> = {};
    const memoryStorage: Storage = {
      length: 0,
      clear: () => {
        Object.keys(backing).forEach((key) => delete backing[key]);
      },
      getItem: (key: string) => backing[key] ?? null,
      key: () => null,
      removeItem: (key: string) => {
        delete backing[key];
      },
      setItem: (key: string, value: string) => {
        backing[key] = value;
      },
    };

    const storage = new LeaderboardStorage({ storage: memoryStorage, maxEntries: 3 });
    storage.add({
      id: '1',
      initials: 'AAA',
      score: 100,
      combo: 2,
      mode: 'classic',
      occurredAt: 1,
    });
    storage.add({
      id: '2',
      initials: 'BBB',
      score: 120,
      combo: 1,
      mode: 'classic',
      occurredAt: 2,
    });
    const latest = storage.add({
      id: '3',
      initials: 'CCC',
      score: 120,
      combo: 3,
      mode: 'timed',
      occurredAt: 3,
    });
    expect(latest[0].id).toBe('3');
    expect(latest[1].id).toBe('2');
    expect(latest[2].id).toBe('1');
  });
});
