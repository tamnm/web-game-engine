import { UIOverlay } from '@web-game-engine/core';
import type { SnakeGameMode } from '../components';
import type { LeaderboardEntry } from './LeaderboardStorage';

export type UIState =
  | 'main-menu'
  | 'mode-select'
  | 'settings'
  | 'playing'
  | 'paused'
  | 'game-over'
  | 'leaderboard'
  | 'replay-view';

export interface SuperSnakeUIEvents {
  start: { mode: SnakeGameMode };
  resume: void;
  restart: void;
  exitToMenu: void;
  openSettings: void;
  closeSettings: void;
  saveInitials: { initials: string };
  viewReplay: { entry: LeaderboardEntry };
  deleteEntry: { entry: LeaderboardEntry };
}

const DEFAULT_MODES: SnakeGameMode[] = ['classic', 'timed', 'endless', 'challenge'];
const FONT_STACK = '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif';

export interface ScoreSnapshot {
  mode: SnakeGameMode;
  score: number;
  combo: number;
}

export interface SuperSnakeUIOptions {
  container?: HTMLElement;
  modes?: SnakeGameMode[];
  availableModes?: SnakeGameMode[];
}

export class SuperSnakeUI {
  private readonly overlay: UIOverlay;
  private state: UIState = 'main-menu';
  private readonly modes: SnakeGameMode[];
  private readonly availableModes: Set<SnakeGameMode>;
  private leaderboard: LeaderboardEntry[] = [];
  private lastScore: ScoreSnapshot | null = null;
  private replayPreview: LeaderboardEntry | null = null;
  private readonly listeners = new Map<keyof SuperSnakeUIEvents, Set<unknown>>();
  private modeFeedback: string | null = null;

  constructor(options: SuperSnakeUIOptions = {}) {
    this.overlay = new UIOverlay({ container: options.container });
    this.modes = options.modes ?? DEFAULT_MODES;
    this.availableModes = new Set(options.availableModes ?? ['classic']);
    this.overlay.attach();
    this.render();
  }

  on<K extends keyof SuperSnakeUIEvents>(
    event: K,
    handler: (payload: SuperSnakeUIEvents[K]) => void
  ): () => void {
    const existing = this.listeners.get(event) as
      | Set<(payload: SuperSnakeUIEvents[K]) => void>
      | undefined;
    const set = existing ?? new Set<(payload: SuperSnakeUIEvents[K]) => void>();
    set.add(handler);
    this.listeners.set(event, set as Set<unknown>);
    return () => {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  setState(state: UIState): void {
    this.state = state;
    if (state !== 'mode-select') {
      this.modeFeedback = null;
    }
    this.render();
  }

  getState(): UIState {
    return this.state;
  }

  setLeaderboard(entries: LeaderboardEntry[]): void {
    this.leaderboard = entries;
    if (this.state === 'leaderboard' || this.state === 'game-over') {
      this.render();
    }
  }

  setLastScore(snapshot: ScoreSnapshot | null): void {
    this.lastScore = snapshot;
    if (this.state === 'game-over') {
      this.render();
    }
  }

  setReplayPreview(entry: LeaderboardEntry | null): void {
    this.replayPreview = entry;
    if (this.state === 'replay-view') {
      this.render();
    }
  }

  dispose(): void {
    this.overlay.clear();
    this.overlay.detach();
  }

  private render(): void {
    this.overlay.clear();
    switch (this.state) {
      case 'main-menu':
        this.renderMainMenu();
        break;
      case 'mode-select':
        this.renderModeSelect();
        break;
      case 'settings':
        this.renderSettings();
        break;
      case 'paused':
        this.renderPause();
        break;
      case 'game-over':
        this.renderGameOver();
        break;
      case 'leaderboard':
        this.renderLeaderboard();
        break;
      case 'replay-view':
        this.renderReplayView();
        break;
      case 'playing':
        // no overlay while playing
        break;
    }
  }

  private renderMainMenu(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Super Snake' });
    this.stylePanel(panel, 320);

    const startBtn = this.createButton('Start', () => this.setState('mode-select'));
    panel.appendChild(startBtn);

    const leaderboardBtn = this.createButton('Leaderboard', () => this.setState('leaderboard'));
    panel.appendChild(leaderboardBtn);

    const settingsBtn = this.createButton('Settings', () => {
      this.emit('openSettings', undefined);
      this.setState('settings');
    });
    panel.appendChild(settingsBtn);
  }

  private renderModeSelect(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Select Mode' });
    this.stylePanel(panel, 360);

    const info = document.createElement('p');
    info.textContent = this.modeFeedback ?? 'Classic is ready to play. Other modes are on the way!';
    info.style.margin = '0 0 12px 0';
    info.style.opacity = '0.85';
    info.style.fontSize = '15px';
    info.style.color = '#dbe6ff';
    info.style.fontFamily = FONT_STACK;
    panel.appendChild(info);

    this.modes.forEach((mode) => {
      const available = this.availableModes.has(mode);
      const label = available ? this.formatMode(mode) : `${this.formatMode(mode)} · Coming Soon`;
      const btn = this.createButton(label, () => {
        if (available) {
          this.emit('start', { mode });
        } else {
          this.modeFeedback = `${this.formatMode(mode)} mode is coming soon.`;
          this.render();
        }
      });
      if (!available) {
        btn.style.background = 'linear-gradient(135deg, #242d3a, #141922)';
        btn.style.borderColor = '#55657a';
        btn.style.opacity = '0.7';
      }
      panel.appendChild(btn);
    });
    const back = this.createButton('Back', () => this.setState('main-menu'));
    panel.appendChild(back);
  }

  private renderSettings(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Settings' });
    this.stylePanel(panel, 360);
    const info = document.createElement('p');
    info.textContent = 'Remap controls via coming UI or use browser dev tools (future work).';
    info.style.margin = '0 0 12px 0';
    info.style.fontFamily = FONT_STACK;
    info.style.fontSize = '15px';
    info.style.opacity = '0.85';
    panel.appendChild(info);

    const close = this.createButton('Close', () => {
      this.emit('closeSettings', undefined);
      this.setState('main-menu');
    });
    panel.appendChild(close);
  }

  private renderPause(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Paused' });
    this.stylePanel(panel, 300);
    panel.appendChild(this.createButton('Resume', () => this.emit('resume', undefined)));
    panel.appendChild(
      this.createButton('Restart', () => {
        this.emit('restart', undefined);
      })
    );
    panel.appendChild(
      this.createButton('Settings', () => {
        this.emit('openSettings', undefined);
        this.setState('settings');
      })
    );
    panel.appendChild(
      this.createButton('Exit to Menu', () => {
        this.emit('exitToMenu', undefined);
        this.setState('main-menu');
      })
    );
  }

  private renderGameOver(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Game Over' });
    this.stylePanel(panel, 360);
    const paragraph = document.createElement('p');
    const summary = this.lastScore
      ? `Mode: ${this.formatMode(this.lastScore.mode)} · Score ${this.lastScore.score} · Combo x${this.lastScore.combo}`
      : 'Score unavailable';
    paragraph.textContent = summary;
    paragraph.style.margin = '0 0 12px 0';
    paragraph.style.fontFamily = FONT_STACK;
    paragraph.style.fontSize = '15px';
    panel.appendChild(paragraph);

    const initialsLabel = document.createElement('label');
    initialsLabel.textContent = 'Enter initials:';
    initialsLabel.style.display = 'block';
    initialsLabel.style.marginBottom = '4px';
    initialsLabel.style.fontFamily = FONT_STACK;
    initialsLabel.style.fontSize = '14px';
    panel.appendChild(initialsLabel);

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 3;
    input.value = 'AAA';
    input.style.textTransform = 'uppercase';
    input.style.marginBottom = '10px';
    input.style.fontFamily = FONT_STACK;
    input.style.fontSize = '16px';
    input.addEventListener('input', () => {
      input.value = input.value
        .replace(/[^A-Za-z]/g, '')
        .toUpperCase()
        .slice(0, 3);
    });
    panel.appendChild(input);

    const saveBtn = this.createButton('Save Score', () => {
      const initials = input.value.trim().toUpperCase() || 'AAA';
      this.emit('saveInitials', { initials });
    });
    panel.appendChild(saveBtn);

    const leaderboardBtn = this.createButton('View Leaderboard', () =>
      this.setState('leaderboard')
    );
    panel.appendChild(leaderboardBtn);

    const retryBtn = this.createButton('Play Again', () => this.emit('restart', undefined));
    panel.appendChild(retryBtn);
  }

  private renderLeaderboard(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Leaderboard' });
    this.stylePanel(panel, 420);
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '6px';
    if (this.leaderboard.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No scores yet.';
      empty.style.fontFamily = FONT_STACK;
      list.appendChild(empty);
    } else {
      this.leaderboard.forEach((entry) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.fontFamily = FONT_STACK;
        const label = document.createElement('span');
        label.textContent = `${entry.initials} · ${this.formatMode(entry.mode as SnakeGameMode)} · ${entry.score}`;
        label.style.fontFamily = FONT_STACK;
        label.style.fontSize = '14px';
        row.appendChild(label);
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';
        if (entry.replay) {
          const replayBtn = this.createButton('Replay', () => {
            this.replayPreview = entry;
            this.setState('replay-view');
            this.emit('viewReplay', { entry });
          });
          actions.appendChild(replayBtn);
        }
        const deleteBtn = this.createButton('Delete', () => {
          this.emit('deleteEntry', { entry });
        });
        actions.appendChild(deleteBtn);
        row.appendChild(actions);
        list.appendChild(row);
      });
    }
    panel.appendChild(list);

    const backBtn = this.createButton('Back', () => this.setState('main-menu'));
    panel.appendChild(backBtn);
  }

  private renderReplayView(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Replay Details' });
    this.stylePanel(panel, 420);
    const entry = this.replayPreview;
    if (!entry) {
      const empty = document.createElement('p');
      empty.textContent = 'No replay selected.';
      panel.appendChild(empty);
    } else {
      const meta = document.createElement('p');
      meta.textContent = `${entry.initials} · ${this.formatMode(entry.mode as SnakeGameMode)} · ${entry.score}`;
      panel.appendChild(meta);

      const payload = document.createElement('pre');
      payload.textContent = JSON.stringify(entry.replay?.data, null, 2);
      payload.style.maxHeight = '200px';
      payload.style.overflow = 'auto';
      panel.appendChild(payload);
    }
    const back = this.createButton('Back to Leaderboard', () => this.setState('leaderboard'));
    panel.appendChild(back);
  }

  private createButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    const s = btn.style;
    s.pointerEvents = 'auto';
    s.padding = '12px 14px';
    s.marginBottom = '10px';
    s.borderRadius = '10px';
    s.border = '1px solid #3f4f66';
    s.background = 'linear-gradient(135deg, #0f141c, #1b2738)';
    s.color = '#f7fbff';
    s.cursor = 'pointer';
    s.width = '100%';
    s.fontSize = '15px';
    s.fontWeight = '600';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      onClick();
    });
    return btn;
  }

  private formatMode(mode: SnakeGameMode): string {
    switch (mode) {
      case 'classic':
        return 'Classic';
      case 'timed':
        return 'Timed';
      case 'endless':
        return 'Endless';
      case 'challenge':
        return 'Challenge';
      default:
        return mode;
    }
  }

  private emit<K extends keyof SuperSnakeUIEvents>(event: K, payload: SuperSnakeUIEvents[K]): void {
    const listeners = this.listeners.get(event) as
      | Set<(payload: SuperSnakeUIEvents[K]) => void>
      | undefined;
    if (!listeners) return;
    for (const handler of Array.from(listeners)) {
      handler(payload);
    }
  }

  private stylePanel(panel: HTMLDivElement, minWidth: number): void {
    panel.style.minWidth = `${minWidth}px`;
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.alignItems = 'stretch';
    panel.style.gap = '10px';
    panel.style.textAlign = 'center';
    panel.style.boxShadow = '0 18px 38px rgba(5, 8, 12, 0.45)';
    panel.style.background =
      'linear-gradient(155deg, rgba(15, 22, 34, 0.95), rgba(7, 10, 16, 0.93))';
    panel.style.borderColor = '#42536b';
    panel.style.color = '#eef3ff';
    panel.style.backdropFilter = 'blur(18px)';
    panel.style.padding = '18px 22px';
    panel.style.fontFamily = FONT_STACK;
  }
}
