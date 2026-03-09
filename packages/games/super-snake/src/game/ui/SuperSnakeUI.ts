import type { ActionBinding } from '@web-game-engine/core';
import { UIOverlay } from '@web-game-engine/core';
import type { SnakeGameMode } from '../components';
import type { LevelPreview } from '../LevelPresets';
import type { ControlAction } from '../input';
import type { SuperSnakeSettings } from '../settings';
import type { LeaderboardEntry } from './LeaderboardStorage';

export type UIState =
  | 'main-menu'
  | 'settings'
  | 'playing'
  | 'paused'
  | 'game-over'
  | 'leaderboard'
  | 'replay-view'
  | 'level-up';

export interface SuperSnakeUIEvents {
  start: { mode: SnakeGameMode };
  resume: void;
  restart: void;
  exitToMenu: void;
  openModeSelect: void;
  openSettings: void;
  closeSettings: void;
  saveInitials: { initials: string };
  startReplay: { entry: LeaderboardEntry };
  stopReplay: void;
  deleteEntry: { entry: LeaderboardEntry };
  confirmLevelUp: void;
  updateSettings: { settings: SuperSnakeSettings };
  requestRebind: { action: ControlAction };
  resetBindings: void;
  setReplaySpeed: { speed: number };
  toggleReplayPause: void;
}

const DEFAULT_MODES: SnakeGameMode[] = ['classic', 'timed', 'endless', 'challenge'];
const FONT_STACK = '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif';
const REPLAY_SPEEDS = [0.5, 1, 2];

export interface ScoreSnapshot {
  mode: SnakeGameMode;
  score: number;
  combo: number;
}

export interface ReplayStatus {
  title: string;
  score: number;
  combo: number;
  currentTimeMs: number;
  durationMs: number;
  speed: number;
  paused: boolean;
}

export interface SuperSnakeUIOptions {
  container?: HTMLElement;
  modes?: SnakeGameMode[];
  availableModes?: SnakeGameMode[];
  levels?: LevelPreview[];
  defaultLevelId?: string;
}

interface LevelUpContext {
  currentLevel: LevelPreview;
  nextLevel: LevelPreview;
  score: number;
  combo: number;
}

interface HudPowerUpInfo {
  id: number;
  icon: string;
  label: string;
  remainingMs: number;
}

interface HudState {
  levelName: string;
  score: number;
  combo: number;
  highScore: number;
  activePowerUps: HudPowerUpInfo[];
  timerLabel?: string;
  modeLabel?: string;
  replaying?: boolean;
}

export class SuperSnakeUI {
  private readonly overlay: UIOverlay;
  private state: UIState = 'main-menu';
  private readonly modes: SnakeGameMode[];
  private readonly availableModes: Set<SnakeGameMode>;
  private leaderboard: LeaderboardEntry[] = [];
  private lastScore: ScoreSnapshot | null = null;
  private replayPreview: LeaderboardEntry | null = null;
  private levelUpContext: LevelUpContext | null = null;
  private readonly listeners = new Map<keyof SuperSnakeUIEvents, Set<unknown>>();
  private hudState: HudState | null = null;
  private hudBar: HTMLDivElement | null = null;
  private hudPrimaryLabel: HTMLDivElement | null = null;
  private hudScoreLabel: HTMLDivElement | null = null;
  private hudComboLabel: HTMLDivElement | null = null;
  private hudHighScoreLabel: HTMLDivElement | null = null;
  private hudTimerLabel: HTMLDivElement | null = null;
  private hudPowerUpsContainer: HTMLDivElement | null = null;
  private settings: SuperSnakeSettings | null = null;
  private bindings: Partial<Record<ControlAction, ActionBinding[]>> = {};
  private pendingRebindAction: ControlAction | null = null;
  private replayStatus: ReplayStatus | null = null;

  constructor(options: SuperSnakeUIOptions = {}) {
    this.overlay = new UIOverlay({ container: options.container });
    this.modes = options.modes ?? DEFAULT_MODES;
    this.availableModes = new Set(options.availableModes ?? DEFAULT_MODES);
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
    this.render();
  }

  getState(): UIState {
    return this.state;
  }

  setLeaderboard(entries: LeaderboardEntry[]): void {
    this.leaderboard = entries;
    if (
      this.state === 'leaderboard' ||
      this.state === 'game-over' ||
      this.state === 'replay-view'
    ) {
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

  setReplayStatus(status: ReplayStatus | null): void {
    this.replayStatus = status;
    if (this.state === 'replay-view') {
      this.render();
    }
  }

  setLevelUpContext(context: LevelUpContext | null): void {
    this.levelUpContext = context;
    if (this.state === 'level-up') {
      this.render();
    }
  }

  setSettings(settings: SuperSnakeSettings): void {
    this.settings = {
      ...settings,
      enabledModes: [...settings.enabledModes],
      audio: { ...settings.audio },
      display: { ...settings.display },
      bindings: Object.fromEntries(
        Object.entries(settings.bindings).map(([action, bindings]) => [
          action,
          bindings?.map((binding) => ({ ...binding })) ?? [],
        ])
      ) as Partial<Record<ControlAction, ActionBinding[]>>,
    };
    this.bindings = this.settings.bindings;
    if (this.state === 'settings') {
      this.render();
    }
  }

  setPendingRebindAction(action: ControlAction | null): void {
    this.pendingRebindAction = action;
    if (this.state === 'settings') {
      this.render();
    }
  }

  setHudState(state: HudState | null): void {
    this.hudState = state;
    if (state === null) {
      this.destroyHud();
      return;
    }
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'replay-view') {
      this.ensureHudBar();
      this.updateHudContent();
    }
  }

  dispose(): void {
    this.overlay.clear();
    this.overlay.detach();
  }

  private render(): void {
    this.overlay.clear();
    this.resetHudRefs();

    if (
      this.hudState &&
      (this.state === 'playing' || this.state === 'paused' || this.state === 'replay-view')
    ) {
      this.ensureHudBar();
      this.updateHudContent();
    }

    switch (this.state) {
      case 'main-menu':
        this.renderMainMenu();
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
      case 'level-up':
        this.renderLevelUp();
        break;
      case 'playing':
        break;
    }
  }

  private renderMainMenu(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Super Snake' });
    this.stylePanel(panel, 360);

    this.modes.forEach((mode) => {
      const btn = this.createButton(this.describeMode(mode), () => {
        if (this.availableModes.has(mode)) {
          this.emit('start', { mode });
        }
      });
      panel.appendChild(btn);
    });

    panel.appendChild(this.createButton('Leaderboard', () => this.setState('leaderboard')));
    panel.appendChild(
      this.createButton('Settings', () => {
        this.emit('openSettings', undefined);
        this.setState('settings');
      })
    );
  }

  private renderSettings(): void {
    const settings = this.settings;
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Settings' });
    this.stylePanel(panel, 460);

    if (!settings) {
      panel.appendChild(this.createParagraph('Settings unavailable.'));
      panel.appendChild(
        this.createButton('Back', () => {
          this.emit('closeSettings', undefined);
        })
      );
      return;
    }

    panel.appendChild(
      this.renderToggle('Reduced Motion', settings.display.reducedMotion, (checked) => {
        this.pushSettings({
          ...settings,
          display: { ...settings.display, reducedMotion: checked },
        });
      })
    );
    panel.appendChild(
      this.renderToggle('Pixel Perfect', settings.display.pixelPerfect, (checked) => {
        this.pushSettings({
          ...settings,
          display: { ...settings.display, pixelPerfect: checked },
        });
      })
    );
    panel.appendChild(
      this.renderToggle('Audio Enabled', settings.audio.enabled, (checked) => {
        this.pushSettings({
          ...settings,
          audio: { ...settings.audio, enabled: checked },
        });
      })
    );

    panel.appendChild(
      this.renderRange('Music Volume', settings.audio.musicVolume, (value) => {
        this.pushSettings({
          ...settings,
          audio: { ...settings.audio, musicVolume: value },
        });
      })
    );
    panel.appendChild(
      this.renderRange('SFX Volume', settings.audio.sfxVolume, (value) => {
        this.pushSettings({
          ...settings,
          audio: { ...settings.audio, sfxVolume: value },
        });
      })
    );

    const bindingsTitle = document.createElement('div');
    bindingsTitle.textContent = 'Controls';
    bindingsTitle.style.fontWeight = '700';
    bindingsTitle.style.marginTop = '8px';
    panel.appendChild(bindingsTitle);

    (['move-up', 'move-down', 'move-left', 'move-right', 'pause'] as ControlAction[]).forEach(
      (action) => panel.appendChild(this.renderBindingRow(action))
    );

    if (this.pendingRebindAction) {
      panel.appendChild(
        this.createParagraph(`Press a key to bind ${this.formatAction(this.pendingRebindAction)}.`)
      );
    }

    panel.appendChild(
      this.createButton('Reset Bindings', () => this.emit('resetBindings', undefined))
    );
    panel.appendChild(
      this.createButton('Back', () => {
        this.emit('closeSettings', undefined);
      })
    );
  }

  private renderPause(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Paused' });
    this.stylePanel(panel, 320);
    panel.appendChild(this.createButton('Resume', () => this.emit('resume', undefined)));
    panel.appendChild(this.createButton('Restart', () => this.emit('restart', undefined)));
    panel.appendChild(
      this.createButton('Mode Select', () => this.emit('openModeSelect', undefined))
    );
    panel.appendChild(
      this.createButton('Settings', () => {
        this.emit('openSettings', undefined);
        this.setState('settings');
      })
    );
    panel.appendChild(this.createButton('Exit to Menu', () => this.emit('exitToMenu', undefined)));
  }

  private renderGameOver(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Game Over' });
    this.stylePanel(panel, 380);
    const summary = this.lastScore
      ? `Mode: ${this.formatMode(this.lastScore.mode)} · Score ${this.lastScore.score} · Combo x${this.lastScore.combo}`
      : 'Score unavailable';
    panel.appendChild(this.createParagraph(summary));

    const initialsLabel = document.createElement('label');
    initialsLabel.textContent = 'Enter initials:';
    initialsLabel.style.display = 'block';
    initialsLabel.style.marginBottom = '4px';
    initialsLabel.style.fontFamily = FONT_STACK;
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

    panel.appendChild(
      this.createButton('Save Score', () => {
        const initials = input.value.trim().toUpperCase() || 'AAA';
        this.emit('saveInitials', { initials });
      })
    );
    panel.appendChild(this.createButton('View Leaderboard', () => this.setState('leaderboard')));
    panel.appendChild(this.createButton('Play Again', () => this.emit('restart', undefined)));
    panel.appendChild(
      this.createButton('Mode Select', () => this.emit('openModeSelect', undefined))
    );
  }

  private renderLeaderboard(): void {
    const panel = this.overlay.addPanel({ anchor: 'center', title: 'Leaderboard' });
    this.stylePanel(panel, 460);
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';
    if (this.leaderboard.length === 0) {
      list.appendChild(this.createParagraph('No scores yet.'));
    } else {
      this.leaderboard.forEach((entry) => {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr auto';
        row.style.gap = '8px';
        row.style.alignItems = 'center';

        const label = document.createElement('div');
        label.textContent = `${entry.initials} · ${this.formatMode(entry.mode as SnakeGameMode)} · ${entry.score} · Combo x${entry.combo}`;
        label.style.fontFamily = FONT_STACK;
        label.style.fontSize = '14px';
        row.appendChild(label);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';
        if (entry.replay) {
          actions.appendChild(
            this.createInlineButton('Replay', () => {
              this.replayPreview = entry;
              this.emit('startReplay', { entry });
              this.setState('replay-view');
            })
          );
        }
        actions.appendChild(
          this.createInlineButton('Delete', () => {
            this.emit('deleteEntry', { entry });
          })
        );
        row.appendChild(actions);
        list.appendChild(row);
      });
    }
    panel.appendChild(list);
    panel.appendChild(this.createButton('Back', () => this.setState('main-menu')));
  }

  private renderReplayView(): void {
    const panel = this.overlay.addPanel({ anchor: 'bottom-right', title: 'Replay' });
    this.stylePanel(panel, 340);
    const entry = this.replayPreview;
    if (!entry) {
      panel.appendChild(this.createParagraph('No replay selected.'));
    } else {
      panel.appendChild(
        this.createParagraph(
          `${entry.initials} · ${this.formatMode(entry.mode as SnakeGameMode)} · ${entry.score}`
        )
      );
      if (this.replayStatus) {
        panel.appendChild(
          this.createParagraph(
            `${this.replayStatus.paused ? 'Paused' : 'Playing'} · ${this.formatDuration(
              this.replayStatus.currentTimeMs
            )} / ${this.formatDuration(this.replayStatus.durationMs)} · x${this.replayStatus.speed}`
          )
        );
      } else {
        panel.appendChild(this.createParagraph('Preparing replay...'));
      }
    }

    panel.appendChild(
      this.createButton(this.replayStatus?.paused ? 'Resume Replay' : 'Pause Replay', () =>
        this.emit('toggleReplayPause', undefined)
      )
    );
    panel.appendChild(
      this.createButton(`Speed: x${this.nextReplaySpeed()}`, () =>
        this.emit('setReplaySpeed', { speed: this.nextReplaySpeed() })
      )
    );
    panel.appendChild(
      this.createButton('Back to Leaderboard', () => {
        this.emit('stopReplay', undefined);
        this.setState('leaderboard');
      })
    );
  }

  private renderLevelUp(): void {
    const context = this.levelUpContext;
    const title = context ? `Level Up — ${context.nextLevel.name}` : 'Level Up';
    const panel = this.overlay.addPanel({ anchor: 'center', title });
    this.stylePanel(panel, 420);
    panel.appendChild(
      this.createParagraph(context ? `Cleared ${context.currentLevel.name}!` : 'Level complete!')
    );
    panel.appendChild(
      this.createParagraph(
        context
          ? `Score ${context.score.toLocaleString()} · Combo x${context.combo}`
          : 'Keep pushing.'
      )
    );
    if (context) {
      panel.appendChild(
        this.createParagraph(`${context.nextLevel.name}: ${context.nextLevel.description}`)
      );
    }
    panel.appendChild(this.createButton('Continue', () => this.emit('confirmLevelUp', undefined)));
    panel.appendChild(
      this.createButton('Mode Select', () => this.emit('openModeSelect', undefined))
    );
  }

  private renderBindingRow(action: ControlAction): HTMLDivElement {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr auto';
    row.style.gap = '8px';
    row.style.alignItems = 'center';
    row.style.padding = '8px 0';

    const label = document.createElement('div');
    label.textContent = `${this.formatAction(action)}: ${this.describeBindings(action)}`;
    label.style.fontFamily = FONT_STACK;
    label.style.fontSize = '14px';
    row.appendChild(label);

    row.appendChild(
      this.createInlineButton(this.pendingRebindAction === action ? 'Listening...' : 'Rebind', () =>
        this.emit('requestRebind', { action })
      )
    );
    return row;
  }

  private renderToggle(
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLElement {
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.fontFamily = FONT_STACK;
    row.style.fontSize = '14px';
    row.style.padding = '4px 0';
    row.textContent = label;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    row.appendChild(input);
    return row;
  }

  private renderRange(
    label: string,
    value: number,
    onChange: (value: number) => void
  ): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'grid';
    wrapper.style.gridTemplateColumns = '1fr auto';
    wrapper.style.gap = '8px';
    wrapper.style.alignItems = 'center';
    wrapper.style.fontFamily = FONT_STACK;
    wrapper.style.fontSize = '14px';

    const left = document.createElement('label');
    left.textContent = `${label}: ${Math.round(value * 100)}%`;
    wrapper.appendChild(left);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.value = `${Math.round(value * 100)}`;
    input.addEventListener('input', () => onChange(Number(input.value) / 100));
    wrapper.appendChild(input);
    return wrapper;
  }

  private ensureHudBar(): void {
    if (this.hudBar) {
      return;
    }
    const panel = this.overlay.addPanel({ anchor: 'top-left' });
    panel.dataset.testid = 'super-snake-hud';
    const s = panel.style;
    s.pointerEvents = 'none';
    s.position = 'absolute';
    s.top = '24px';
    s.left = '50%';
    s.transform = 'translateX(-50%)';
    s.width = 'min(1040px, calc(100% - 48px))';
    s.display = 'flex';
    s.flexWrap = 'wrap';
    s.alignItems = 'center';
    s.justifyContent = 'space-between';
    s.gap = '18px';
    s.padding = '14px 20px';
    s.borderRadius = '16px';
    s.border = '1px solid rgba(98, 134, 178, 0.45)';
    s.background = 'linear-gradient(155deg, rgba(8, 14, 24, 0.92), rgba(6, 10, 18, 0.88))';
    s.boxShadow = '0 20px 40px rgba(4, 8, 16, 0.45)';
    s.backdropFilter = 'blur(12px)';
    panel.style.fontFamily = FONT_STACK;

    const primaryValue = this.createHudGroup(panel, 'Mode');
    const scoreValue = this.createHudGroup(panel, 'Score');
    const comboValue = this.createHudGroup(panel, 'Combo');
    const highScoreValue = this.createHudGroup(panel, 'High Score');
    const timerValue = this.createHudGroup(panel, 'Status');
    const powerUpValue = this.createHudGroup(panel, 'Power-Ups', true);
    powerUpValue.style.display = 'flex';
    powerUpValue.style.flexWrap = 'wrap';
    powerUpValue.style.alignItems = 'center';
    powerUpValue.style.gap = '8px';
    powerUpValue.style.minHeight = '32px';

    this.hudBar = panel;
    this.hudPrimaryLabel = primaryValue;
    this.hudScoreLabel = scoreValue;
    this.hudComboLabel = comboValue;
    this.hudHighScoreLabel = highScoreValue;
    this.hudTimerLabel = timerValue;
    this.hudPowerUpsContainer = powerUpValue;
  }

  private createHudGroup(panel: HTMLDivElement, label: string, expandable = false): HTMLDivElement {
    const group = document.createElement('div');
    group.style.display = 'flex';
    group.style.flexDirection = 'column';
    group.style.gap = '4px';
    group.style.minWidth = expandable ? '220px' : '120px';
    group.style.flex = expandable ? '1 1 260px' : '0 0 auto';

    const labelEl = document.createElement('div');
    labelEl.textContent = label.toUpperCase();
    labelEl.style.fontSize = '11px';
    labelEl.style.letterSpacing = '0.18em';
    labelEl.style.fontWeight = '600';
    labelEl.style.opacity = '0.65';

    const valueEl = document.createElement('div');
    valueEl.style.fontSize = '20px';
    valueEl.style.fontWeight = '600';
    valueEl.style.lineHeight = '1.2';
    valueEl.style.color = '#f5fbff';

    group.appendChild(labelEl);
    group.appendChild(valueEl);
    panel.appendChild(group);
    return valueEl;
  }

  private updateHudContent(): void {
    if (!this.hudState) return;
    this.hudPrimaryLabel!.textContent = `${this.hudState.modeLabel ?? this.hudState.levelName}${
      this.hudState.replaying ? ' · Replay' : ''
    }`;
    this.hudScoreLabel!.textContent = this.hudState.score.toLocaleString();
    this.hudComboLabel!.textContent = `x${this.hudState.combo}`;
    this.hudHighScoreLabel!.textContent = this.hudState.highScore.toLocaleString();
    this.hudTimerLabel!.textContent = this.hudState.timerLabel ?? this.hudState.levelName;
    this.hudPowerUpsContainer!.innerHTML = '';
    if (this.hudState.activePowerUps.length === 0) {
      const empty = document.createElement('span');
      empty.textContent = 'None';
      empty.style.opacity = '0.6';
      empty.style.fontSize = '14px';
      this.hudPowerUpsContainer!.appendChild(empty);
    } else {
      this.hudState.activePowerUps.forEach((info) => {
        const chip = document.createElement('div');
        chip.textContent = `${info.icon} ${info.label} · ${this.formatPowerUpCountdown(info.remainingMs)}`;
        chip.style.padding = '6px 10px';
        chip.style.borderRadius = '999px';
        chip.style.background = 'rgba(35, 52, 74, 0.65)';
        chip.style.border = '1px solid rgba(105, 155, 225, 0.35)';
        chip.style.fontSize = '13px';
        chip.style.fontWeight = '500';
        chip.style.color = '#e5f1ff';
        this.hudPowerUpsContainer!.appendChild(chip);
      });
    }
  }

  private createButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    const s = btn.style;
    s.pointerEvents = 'auto';
    s.padding = '12px 14px';
    s.marginBottom = '8px';
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

  private createInlineButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = this.createButton(label, onClick);
    btn.style.width = 'auto';
    btn.style.marginBottom = '0';
    btn.style.padding = '6px 10px';
    btn.style.fontSize = '13px';
    return btn;
  }

  private createParagraph(text: string): HTMLParagraphElement {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    paragraph.style.margin = '0 0 10px 0';
    paragraph.style.fontFamily = FONT_STACK;
    paragraph.style.fontSize = '14px';
    paragraph.style.opacity = '0.9';
    return paragraph;
  }

  private describeMode(mode: SnakeGameMode): string {
    switch (mode) {
      case 'classic':
        return 'Classic · Progressive levels and wrap movement';
      case 'timed':
        return 'Timed · 60 second score attack';
      case 'endless':
        return 'Endless · No timer, faster pacing';
      case 'challenge':
        return 'Challenge · Solid walls and tougher hazards';
      default:
        return this.formatMode(mode);
    }
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

  private formatAction(action: ControlAction): string {
    switch (action) {
      case 'move-up':
        return 'Move Up';
      case 'move-down':
        return 'Move Down';
      case 'move-left':
        return 'Move Left';
      case 'move-right':
        return 'Move Right';
      case 'pause':
        return 'Pause';
      default:
        return action;
    }
  }

  private describeBindings(action: ControlAction): string {
    const bindings = this.bindings[action] ?? [];
    if (bindings.length === 0) {
      return 'Unbound';
    }
    return bindings.map((binding) => binding.code).join(', ');
  }

  private nextReplaySpeed(): number {
    const current = this.replayStatus?.speed ?? 1;
    const index = REPLAY_SPEEDS.indexOf(current);
    return REPLAY_SPEEDS[(index + 1 + REPLAY_SPEEDS.length) % REPLAY_SPEEDS.length];
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private formatPowerUpCountdown(ms: number): string {
    const seconds = Math.max(0, ms / 1000);
    if (seconds >= 10) {
      return `${Math.floor(seconds)}s`;
    }
    return `${seconds.toFixed(1)}s`;
  }

  private pushSettings(settings: SuperSnakeSettings): void {
    this.settings = settings;
    this.bindings = settings.bindings;
    this.emit('updateSettings', { settings });
    this.render();
  }

  private destroyHud(): void {
    if (this.hudBar) {
      this.hudBar.remove();
    }
    this.resetHudRefs();
  }

  private resetHudRefs(): void {
    this.hudBar = null;
    this.hudPrimaryLabel = null;
    this.hudScoreLabel = null;
    this.hudComboLabel = null;
    this.hudHighScoreLabel = null;
    this.hudTimerLabel = null;
    this.hudPowerUpsContainer = null;
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
    panel.style.maxWidth = 'min(92vw, 540px)';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.alignItems = 'stretch';
    panel.style.gap = '8px';
    panel.style.textAlign = 'left';
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
