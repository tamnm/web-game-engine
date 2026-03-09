import type { ActionBinding } from '@web-game-engine/core';
import { Scene, World } from '@web-game-engine/core';
import {
  FoodConfig,
  FoodConfigComponent,
  FoodState,
  Grid,
  GridComponent,
  GridMode,
  LevelState,
  LevelStateComponent,
  PowerUpConfig,
  PowerUpConfigComponent,
  PowerUpState,
  PowerUpStateComponent,
  PowerUpType,
  Snake,
  SnakeComponent,
  SnakeGameMode,
  SnakeGameState,
  SnakeGameStateComponent,
  SnakeMovement,
  SnakeMovementComponent,
  SnakeSegment,
} from './components';
import { DEFAULT_LEVEL_PRESETS, LevelPreset } from './LevelPresets';
import { createSeededRandom, parseReplayData, SuperSnakeReplayData } from './replay';
import { SuperSnakeSettings, SuperSnakeSettingsStore } from './settings';
import { SuperSnakeAudio } from './audio';
import { createFoodSystem } from './systems/FoodSystem';
import { createHazardSystem } from './systems/HazardSystem';
import { createPowerUpSystem } from './systems/PowerUpSystem';
import { createSnakeMovementSystem } from './systems/SnakeMovementSystem';
import { spawnSuperSnake, SuperSnakeOptions } from './factory';
import {
  ControlAction,
  getDefaultBindings,
  SuperSnakeInput,
  SuperSnakeInputOptions,
} from './input';
import { interpolatePosition } from './Grid';
import { setNextDirection } from './Snake';
import { LeaderboardEntry, LeaderboardStorage } from './ui/LeaderboardStorage';
import { SuperSnakeUI, SuperSnakeUIOptions } from './ui/SuperSnakeUI';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ReplayRuntime {
  data: SuperSnakeReplayData;
  eventIndex: number;
  speed: number;
  paused: boolean;
  finished: boolean;
}

interface ModeRuntimeConfig {
  label: string;
  gridMode: GridMode;
  timeLimitMs: number | null;
  levelProgression: boolean;
  levelIndex: number;
  moveIntervalMultiplier: number;
  foodSpawnMultiplier: number;
  powerUpSpawnMultiplier: number;
}

export interface SuperSnakeSceneOptions extends SuperSnakeOptions {
  context: CanvasRenderingContext2D;
  input?: SuperSnakeInputOptions;
  ui?: SuperSnakeUIOptions;
  leaderboard?: {
    storageKey?: string;
    maxEntries?: number;
    storage?: Storage;
  };
  settings?: {
    storageKey?: string;
    storage?: Storage;
  };
  levels?: LevelPreset[];
  defaultLevelId?: string;
}

function cloneLevelDefinition(definition: LevelPreset['definition']): LevelPreset['definition'] {
  return {
    id: definition.id,
    name: definition.name,
    theme: { ...definition.theme },
    obstacles: definition.obstacles.map((cell) => ({ ...cell })),
    hazards: definition.hazards.map((hazard) => ({
      ...hazard,
      path: hazard.path.map((cell) => ({ ...cell })),
    })),
  };
}

function makeActionBinding(action: ControlAction, code: string): ActionBinding[] {
  return [{ action, device: 'keyboard', code }];
}

export class SuperSnakeScene extends Scene {
  private readonly movementSystemId = 'super-snake.systems.snake-movement';
  private readonly foodSystemId = 'super-snake.systems.food';
  private readonly hazardSystemId = 'super-snake.systems.hazards';
  private readonly powerUpSystemId = 'super-snake.systems.power-ups';
  private readonly context: CanvasRenderingContext2D;
  private readonly input: SuperSnakeInput;
  private readonly ui: SuperSnakeUI;
  private readonly leaderboard: LeaderboardStorage;
  private readonly settingsStore: SuperSnakeSettingsStore;
  private readonly audio = new SuperSnakeAudio();
  private readonly levelPresets: LevelPreset[];
  private readonly options: SuperSnakeOptions;
  private currentSettings: SuperSnakeSettings;
  private snakeEntity: number | null = null;
  private devicePixelRatio = 1;
  private currentMode: SnakeGameMode = 'classic';
  private highScore = 0;
  private currentLevelId: string;
  private currentLevelIndex = 0;
  private nextLevelScoreTarget: number | null = null;
  private pendingLevelUp: {
    index: number;
    preset: LevelPreset;
    preserved: { score: number; comboCount: number; maxCombo: number };
  } | null = null;
  private replayEvents: Array<{ time: number; direction: SnakeComponent['direction'] }> = [];
  private elapsedMs = 0;
  private lastScoreSnapshot: { mode: SnakeGameMode; score: number; combo: number } | null = null;
  private currentRunSeed = 0;
  private phase:
    | 'menu'
    | 'playing'
    | 'paused'
    | 'game-over'
    | 'level-up'
    | 'replay-playing'
    | 'replay-paused' = 'menu';
  private modeTimeRemainingMs: number | null = null;
  private replay: ReplayRuntime | null = null;
  private particles: Particle[] = [];
  private screenShakeMs = 0;
  private screenShakeStrength = 0;
  private rebindListener: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    world: World,
    {
      context,
      input,
      ui,
      leaderboard,
      settings,
      levels,
      defaultLevelId,
      ...options
    }: SuperSnakeSceneOptions
  ) {
    super('super-snake.scene', world);
    this.context = context;
    this.devicePixelRatio = (globalThis as { devicePixelRatio?: number }).devicePixelRatio ?? 1;
    this.levelPresets = levels ?? DEFAULT_LEVEL_PRESETS;

    const derivedDefinitions =
      options.levelDefinitions?.map(cloneLevelDefinition) ??
      this.levelPresets.map((preset) => cloneLevelDefinition(preset.definition));
    const fallbackLevelId =
      derivedDefinitions[0]?.id ?? this.levelPresets[0]?.definition.id ?? 'aurora-garden';
    const initialLevelId = options.levelId ?? defaultLevelId ?? fallbackLevelId;

    this.options = {
      ...options,
      levelDefinitions: derivedDefinitions,
      levelId: initialLevelId,
    };
    this.currentLevelId = initialLevelId;
    this.currentLevelIndex = this.findPresetIndex(initialLevelId);
    this.nextLevelScoreTarget =
      this.levelPresets[this.currentLevelIndex]?.progression.nextScoreThreshold ?? null;

    const storage = settings?.storage ?? leaderboard?.storage;
    this.settingsStore = new SuperSnakeSettingsStore({
      storage,
      storageKey: settings?.storageKey,
    });
    this.currentSettings = this.settingsStore.load();

    const inputOptions: SuperSnakeInputOptions = {
      storage: input?.storage,
      window: input?.window,
      navigator: input?.navigator,
      gamepadDeadzone: input?.gamepadDeadzone,
      enableKeyboard: input?.enableKeyboard,
      enableTouch: input?.enableTouch,
      enableGamepad: input?.enableGamepad,
    };
    this.input = new SuperSnakeInput(inputOptions);
    this.applyStoredBindings();

    this.leaderboard = new LeaderboardStorage(leaderboard);
    this.ui = new SuperSnakeUI({
      container: context.canvas.parentElement ?? undefined,
      availableModes: this.currentSettings.enabledModes,
      ...ui,
    });
    this.styleCanvas(context.canvas);
    this.ui.setSettings(this.currentSettings);
    this.ui.setState('main-menu');

    const initialEntries = this.leaderboard.load();
    this.highScore = this.computeHighScore(initialEntries);
    this.ui.setLeaderboard(initialEntries);

    this.registerUiEvents();
    this.audio.applySettings(this.currentSettings.audio);

    this.input.onPause(() => {
      if (this.phase === 'playing') {
        this.setPhase('paused');
        this.ui.setState('paused');
      } else if (this.phase === 'paused') {
        this.resume();
      } else if (this.phase === 'replay-playing') {
        this.toggleReplayPause();
      }
    });
  }

  override onEnter(): void {
    this.world.registerSystem(createSnakeMovementSystem());
    this.world.registerSystem(createHazardSystem());
    this.world.registerSystem(createPowerUpSystem());
    this.world.registerSystem(createFoodSystem());
    this.input.attach(this.context.canvas);
    this.setPhase('menu');
    this.ui.setState('main-menu');
  }

  override onExit(): void {
    this.world.unregisterSystem(this.movementSystemId);
    this.world.unregisterSystem(this.foodSystemId);
    this.world.unregisterSystem(this.hazardSystemId);
    this.world.unregisterSystem(this.powerUpSystemId);
    this.input.detach();
    this.stopRebindCapture();
    this.audio.dispose();
    this.ui.dispose();
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }
    this.snakeEntity = null;
  }

  override update(delta: number): void {
    this.updateParticles(delta);
    this.updateScreenShake(delta);

    if (this.phase === 'menu' || this.phase === 'game-over') {
      return;
    }

    if (this.phase === 'paused' || this.phase === 'level-up' || this.phase === 'replay-paused') {
      this.input.update();
      this.syncHudWithState();
      return;
    }

    const scaledDelta = this.phase === 'replay-playing' ? delta * (this.replay?.speed ?? 1) : delta;
    const before = this.captureFrameSnapshot();

    if (this.phase === 'replay-playing') {
      this.consumeReplayDirections();
    } else {
      this.input.update();
      this.consumeLiveDirections();
    }

    this.elapsedMs += scaledDelta;
    if (this.modeTimeRemainingMs !== null) {
      this.modeTimeRemainingMs = Math.max(0, this.modeTimeRemainingMs - scaledDelta);
    }

    this.world.step(scaledDelta);

    const after = this.captureFrameSnapshot();
    this.handlePostStepFeedback(before, after);
    this.syncHudWithState();
    this.checkLevelProgression();
    this.checkForGameOver();
    this.updateReplayStatus();
  }

  override render(): void {
    if (this.snakeEntity === null) return;
    const grid = this.world.getComponent(this.snakeEntity, Grid);
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    const food = this.world.getComponent(this.snakeEntity, FoodState);
    const powerUps = this.world.getComponent(this.snakeEntity, PowerUpState) as
      | PowerUpStateComponent
      | undefined;
    const level = this.world.getComponent(this.snakeEntity, LevelState) as
      | LevelStateComponent
      | undefined;
    const movement = this.world.getComponent(this.snakeEntity, SnakeMovement) as
      | SnakeMovementComponent
      | undefined;
    if (!grid || !snake || !food) {
      return;
    }

    this.ensureCanvasSize(grid.width, grid.height, grid.cellSize);
    const ctx = this.context;
    const canvas = ctx.canvas;
    const logicalWidth = grid.width * grid.cellSize;
    const logicalHeight = grid.height * grid.cellSize;
    const theme = level?.theme;

    ctx.save();
    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    const shakeX =
      this.currentSettings.display.reducedMotion || this.screenShakeMs <= 0
        ? 0
        : (Math.random() - 0.5) * this.screenShakeStrength;
    const shakeY =
      this.currentSettings.display.reducedMotion || this.screenShakeMs <= 0
        ? 0
        : (Math.random() - 0.5) * this.screenShakeStrength;
    if (typeof ctx.translate === 'function') {
      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = theme?.backgroundColor ?? '#051622';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    if (typeof ctx.createLinearGradient === 'function') {
      const gradient = ctx.createLinearGradient(0, 0, logicalWidth, logicalHeight);
      gradient.addColorStop(0, 'rgba(255,255,255,0.04)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    ctx.strokeStyle = theme?.gridLineColor ?? 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= grid.width; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * grid.cellSize, 0);
      ctx.lineTo(x * grid.cellSize, logicalHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= grid.height; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * grid.cellSize);
      ctx.lineTo(logicalWidth, y * grid.cellSize);
      ctx.stroke();
    }

    if (level && level.obstacles.length > 0) {
      ctx.fillStyle = theme?.obstacleColor ?? '#2c3e50';
      level.obstacles.forEach((cell) => {
        const x = cell.x * grid.cellSize;
        const y = cell.y * grid.cellSize;
        ctx.fillRect(x, y, grid.cellSize, grid.cellSize);
      });
    }

    food.items.forEach((item) => {
      const [r, g, b, a] = item.tint;
      ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
        b * 255
      )}, ${a})`;
      const pulse = this.currentSettings.display.reducedMotion
        ? 1
        : 0.92 + Math.sin((this.elapsedMs - item.spawnedAt) / 120) * 0.08;
      const padding = 5 + (1 - pulse) * 3;
      const size = grid.cellSize - padding * 2;
      const x = item.x * grid.cellSize + padding;
      const y = item.y * grid.cellSize + padding;
      ctx.fillRect(x, y, size, size);
    });

    if (powerUps) {
      powerUps.items.forEach((item) => {
        const [r, g, b, a] = item.tint;
        const centerX = item.x * grid.cellSize + grid.cellSize / 2;
        const centerY = item.y * grid.cellSize + grid.cellSize / 2;
        const radius = grid.cellSize * 0.35;
        if (typeof ctx.arc === 'function') {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
            b * 255
          )}, ${a})`;
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.stroke();
        }
        const fontSize = Math.max(16, Math.floor(grid.cellSize * 0.55));
        if (typeof ctx.fillText === 'function') {
          ctx.font = `${fontSize}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(item.icon, centerX, centerY + 1);
        }
      });
    }

    if (level && level.hazards.length > 0) {
      const hazardColor = theme?.hazardColor ?? '#f26c6c';
      const hazardIcon = theme?.hazardIcon ?? '✴️';
      const pulse = 0.85 + Math.sin(this.elapsedMs / 280) * 0.1;
      const hazardsDisabled = level.hazardsDisabledUntil > this.elapsedMs;
      level.hazards.forEach((hazard) => {
        const centerX = hazard.position.x * grid.cellSize + grid.cellSize / 2;
        const centerY = hazard.position.y * grid.cellSize + grid.cellSize / 2;
        const radius = grid.cellSize * 0.4 * pulse;
        if (typeof ctx.arc === 'function') {
          ctx.beginPath();
          ctx.fillStyle = hazardColor;
          ctx.globalAlpha = hazardsDisabled || hazard.active === false ? 0.25 : 0.8;
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        const iconSize = Math.max(16, Math.floor(grid.cellSize * 0.6));
        if (typeof ctx.fillText === 'function') {
          ctx.font = `${iconSize}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(hazardIcon, centerX, centerY);
        }
      });
    }

    this.renderParticles(ctx);
    this.renderSnake(ctx, grid, snake, movement, theme);

    if (!snake.alive) {
      ctx.fillStyle = 'rgba(255, 64, 64, 0.28)';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }
    if (theme?.overlayColor) {
      ctx.fillStyle = theme.overlayColor;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    ctx.restore();
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    canvas.style.imageRendering = this.currentSettings.display.pixelPerfect ? 'pixelated' : 'auto';
  }

  startGame(mode: SnakeGameMode): void {
    if (!this.currentSettings.enabledModes.includes(mode)) {
      return;
    }
    this.audio.play('menu');
    this.currentMode = mode;
    const config = this.getModeConfig(mode);
    this.currentLevelIndex = config.levelIndex;
    const preset = this.getPresetByIndex(config.levelIndex);
    this.pendingLevelUp = null;
    this.ui.setLevelUpContext(null);
    this.replay = null;
    this.ui.setReplayStatus(null);
    this.currentRunSeed = this.makeRunSeed();
    this.createRunForPreset(preset, { modeConfig: config, seed: this.currentRunSeed });
    this.audio.startMusic();
    this.audio.updateReactiveMusic(0, false);
    this.setPhase('playing');
    this.ui.setState('playing');
  }

  getDebugState(): {
    grid: GridComponent;
    snake: {
      alive: boolean;
      direction: SnakeComponent['direction'];
      nextDirection: SnakeComponent['direction'];
      segments: SnakeSegment[];
    };
    food: { items: { id: number; type: string; x: number; y: number }[] };
    powerUps?: {
      items: { id: number; type: string; x: number; y: number }[];
      active: { id: number; type: string; expiresAt: number }[];
    };
    level?: {
      id: string;
      obstacles: { x: number; y: number }[];
      hazards: { id: number; type: string; x: number; y: number }[];
      theme: { id: string };
    };
    state: {
      score: number;
      comboCount: number;
      maxCombo: number;
      mode: SnakeGameMode;
      timeRemainingMs: number | null;
      phase: string;
    };
  } | null {
    if (this.snakeEntity === null) return null;
    const grid = this.world.getComponent(this.snakeEntity, Grid);
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    const food = this.world.getComponent(this.snakeEntity, FoodState);
    const powerUps = this.world.getComponent(this.snakeEntity, PowerUpState) as
      | PowerUpStateComponent
      | undefined;
    const level = this.world.getComponent(this.snakeEntity, LevelState) as
      | LevelStateComponent
      | undefined;
    const state = this.world.getComponent(this.snakeEntity, SnakeGameState) as
      | SnakeGameStateComponent
      | undefined;
    if (!grid || !snake || !food || !state) return null;
    return {
      grid: { ...grid },
      snake: {
        alive: snake.alive,
        direction: snake.direction,
        nextDirection: snake.nextDirection,
        segments: snake.segments.map((segment) => ({ ...segment })),
      },
      food: {
        items: food.items.map((item) => ({ id: item.id, type: item.type, x: item.x, y: item.y })),
      },
      powerUps: powerUps
        ? {
            items: powerUps.items.map((item) => ({
              id: item.id,
              type: item.type,
              x: item.x,
              y: item.y,
            })),
            active: powerUps.active.map((entry) => ({
              id: entry.id,
              type: entry.type,
              expiresAt: entry.expiresAt,
            })),
          }
        : undefined,
      level: level
        ? {
            id: level.levelId,
            obstacles: level.obstacles.map((cell) => ({ x: cell.x, y: cell.y })),
            hazards: level.hazards.map((hazard) => ({
              id: hazard.id,
              type: hazard.definitionId,
              x: hazard.position.x,
              y: hazard.position.y,
            })),
            theme: { id: level.theme.id },
          }
        : undefined,
      state: {
        score: state.score,
        comboCount: state.comboCount,
        maxCombo: state.maxCombo,
        mode: this.currentMode,
        timeRemainingMs: this.modeTimeRemainingMs,
        phase: this.phase,
      },
    };
  }

  private renderSnake(
    ctx: CanvasRenderingContext2D,
    grid: GridComponent,
    snake: SnakeComponent,
    movement: SnakeMovementComponent | undefined,
    theme: LevelStateComponent['theme'] | undefined
  ): void {
    const bodyColor = theme?.snakeBodyColor ?? '#2ecc71';
    const headColor = theme?.snakeHeadColor ?? '#ffffff';
    const progress =
      this.currentSettings.display.reducedMotion || !movement
        ? 1
        : Math.min(1, movement.accumulatorMs / Math.max(1, movement.moveIntervalMs));
    snake.segments.forEach((segment, index) => {
      const padding = index === 0 ? 2 : 4;
      const size = grid.cellSize - padding * 2;
      const previous = snake.segments[index + 1];
      const position = previous
        ? interpolatePosition(previous, segment, grid, grid.mode, progress)
        : segment;
      const x = position.x * grid.cellSize + padding;
      const y = position.y * grid.cellSize + padding;
      ctx.fillStyle = index === 0 ? headColor : bodyColor;
      ctx.fillRect(x, y, size, size);
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size
      );
    }
    ctx.globalAlpha = 1;
  }

  private captureFrameSnapshot(): {
    score: number;
    combo: number;
    activePowerUps: number;
    alive: boolean;
    head: SnakeSegment | null;
  } {
    if (this.snakeEntity === null) {
      return { score: 0, combo: 0, activePowerUps: 0, alive: false, head: null };
    }
    const state = this.world.getComponent(this.snakeEntity, SnakeGameState);
    const powerUps = this.world.getComponent(this.snakeEntity, PowerUpState) as
      | PowerUpStateComponent
      | undefined;
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    return {
      score: state?.score ?? 0,
      combo: state?.comboCount ?? 0,
      activePowerUps: powerUps?.active.length ?? 0,
      alive: snake?.alive ?? false,
      head: snake?.segments[0] ? { ...snake.segments[0] } : null,
    };
  }

  private handlePostStepFeedback(
    before: ReturnType<SuperSnakeScene['captureFrameSnapshot']>,
    after: ReturnType<SuperSnakeScene['captureFrameSnapshot']>
  ): void {
    if (!after.head || this.snakeEntity === null) return;
    if (after.score > before.score) {
      this.audio.play('eat');
      this.spawnBurst(after.head.x, after.head.y, 8, '#ffd166');
      if (after.combo >= 3) {
        this.shake(180, 4 + after.combo);
      }
    }
    if (after.activePowerUps > before.activePowerUps) {
      this.audio.play('powerup');
      this.spawnBurst(after.head.x, after.head.y, 10, '#7df9ff');
      this.shake(220, 6);
    }
    if (before.alive && !after.alive) {
      this.audio.play('collision');
      this.spawnBurst(after.head.x, after.head.y, 16, '#ff6b6b');
      this.shake(400, 10);
    }
    this.audio.updateReactiveMusic(after.combo, after.combo >= 4);
  }

  private spawnBurst(cellX: number, cellY: number, count: number, color: string): void {
    if (this.currentSettings.display.reducedMotion || this.snakeEntity === null) return;
    const size = this.world.getComponent(this.snakeEntity, Grid)?.cellSize ?? 32;
    const centerX = cellX * size + size / 2;
    const centerY = cellY * size + size / 2;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 0.04 + Math.random() * 0.08;
      const life = 420 + Math.random() * 180;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 4 + Math.random() * 4,
        color,
      });
    }
  }

  private updateParticles(delta: number): void {
    if (this.particles.length === 0) return;
    this.particles = this.particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx * delta,
        y: particle.y + particle.vy * delta,
        vy: particle.vy + 0.00012 * delta,
        life: particle.life - delta,
      }))
      .filter((particle) => particle.life > 0);
  }

  private shake(durationMs: number, strength: number): void {
    if (this.currentSettings.display.reducedMotion) return;
    this.screenShakeMs = Math.max(this.screenShakeMs, durationMs);
    this.screenShakeStrength = Math.max(this.screenShakeStrength, strength);
  }

  private updateScreenShake(delta: number): void {
    if (this.screenShakeMs <= 0) {
      this.screenShakeStrength = 0;
      return;
    }
    this.screenShakeMs = Math.max(0, this.screenShakeMs - delta);
    this.screenShakeStrength *= 0.94;
  }

  private ensureCanvasSize(width: number, height: number, cellSize: number): void {
    const canvas = this.context.canvas;
    const logicalWidth = width * cellSize;
    const logicalHeight = height * cellSize;
    const pixelWidth = Math.floor(logicalWidth * this.devicePixelRatio);
    const pixelHeight = Math.floor(logicalHeight * this.devicePixelRatio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
  }

  private styleCanvas(canvas: HTMLCanvasElement): void {
    const s = canvas.style;
    s.display = 'block';
    s.margin = '0 auto';
    s.maxWidth = '100%';
    s.height = 'auto';
    s.borderRadius = '16px';
    s.boxShadow = '0 24px 48px rgba(5, 12, 20, 0.45)';
    s.backgroundColor = 'transparent';
  }

  private findPresetIndex(levelId: string): number {
    const index = this.levelPresets.findIndex((preset) => preset.definition.id === levelId);
    return index >= 0 ? index : 0;
  }

  private getPresetByIndex(index: number): LevelPreset {
    return this.levelPresets[index] ?? this.levelPresets[0];
  }

  private getModeConfig(mode: SnakeGameMode): ModeRuntimeConfig {
    switch (mode) {
      case 'timed':
        return {
          label: 'Timed',
          gridMode: 'wrap',
          timeLimitMs: 60_000,
          levelProgression: true,
          levelIndex: 0,
          moveIntervalMultiplier: 0.92,
          foodSpawnMultiplier: 0.88,
          powerUpSpawnMultiplier: 0.9,
        };
      case 'endless':
        return {
          label: 'Endless',
          gridMode: 'wrap',
          timeLimitMs: null,
          levelProgression: false,
          levelIndex: 1,
          moveIntervalMultiplier: 0.9,
          foodSpawnMultiplier: 0.82,
          powerUpSpawnMultiplier: 0.82,
        };
      case 'challenge':
        return {
          label: 'Challenge',
          gridMode: 'solid',
          timeLimitMs: null,
          levelProgression: true,
          levelIndex: 1,
          moveIntervalMultiplier: 0.84,
          foodSpawnMultiplier: 0.86,
          powerUpSpawnMultiplier: 0.8,
        };
      case 'classic':
      default:
        return {
          label: 'Classic',
          gridMode: 'wrap',
          timeLimitMs: null,
          levelProgression: true,
          levelIndex: 0,
          moveIntervalMultiplier: 1,
          foodSpawnMultiplier: 1,
          powerUpSpawnMultiplier: 1,
        };
    }
  }

  private createRunForPreset(
    preset: LevelPreset,
    options: {
      modeConfig: ModeRuntimeConfig;
      seed: number;
      preservedState?: { score: number; comboCount: number; maxCombo: number };
      replayMode?: SnakeGameMode;
    }
  ): void {
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }

    this.currentLevelId = preset.definition.id;
    this.currentLevelIndex = this.findPresetIndex(this.currentLevelId);
    const random = this.options.random ?? createSeededRandom(options.seed);
    const spawnOptions: SuperSnakeOptions = {
      ...this.options,
      levelId: this.currentLevelId,
      mode: options.modeConfig.gridMode,
      random,
    };
    this.snakeEntity = spawnSuperSnake(this.world, spawnOptions);

    const movement = this.world.getComponent(this.snakeEntity, SnakeMovement) as
      | SnakeMovementComponent
      | undefined;
    if (movement) {
      movement.moveIntervalMs = Math.max(
        16,
        Math.round(
          movement.moveIntervalMs *
            preset.progression.moveIntervalMultiplier *
            options.modeConfig.moveIntervalMultiplier
        )
      );
      movement.accumulatorMs = 0;
    }

    const foodConfig = this.world.getComponent(this.snakeEntity, FoodConfig) as
      | FoodConfigComponent
      | undefined;
    if (foodConfig) {
      foodConfig.spawnIntervalMs = Math.max(
        250,
        Math.round(
          foodConfig.spawnIntervalMs *
            preset.progression.foodSpawnIntervalMultiplier *
            options.modeConfig.foodSpawnMultiplier
        )
      );
    }

    const powerUpConfig = this.world.getComponent(this.snakeEntity, PowerUpConfig) as
      | PowerUpConfigComponent
      | undefined;
    if (powerUpConfig) {
      powerUpConfig.spawnIntervalMs = Math.max(
        800,
        Math.round(
          powerUpConfig.spawnIntervalMs *
            preset.progression.powerUpSpawnIntervalMultiplier *
            options.modeConfig.powerUpSpawnMultiplier
        )
      );
      powerUpConfig.initialDelayMs = Math.max(
        0,
        Math.round(powerUpConfig.initialDelayMs * preset.progression.powerUpInitialDelayMultiplier)
      );
    }

    const state = this.world.getComponent(this.snakeEntity, SnakeGameState) as
      | SnakeGameStateComponent
      | undefined;
    if (state) {
      if (options.preservedState) {
        state.score = options.preservedState.score;
        state.comboCount = options.preservedState.comboCount;
        state.maxCombo = Math.max(options.preservedState.maxCombo, state.maxCombo);
      } else {
        state.score = 0;
        state.comboCount = 0;
        state.maxCombo = 0;
        state.lastConsumedAt = -Infinity;
      }
      this.highScore = Math.max(this.highScore, state.score);
    }

    this.modeTimeRemainingMs = options.modeConfig.timeLimitMs;
    this.nextLevelScoreTarget = options.modeConfig.levelProgression
      ? preset.progression.nextScoreThreshold
      : null;
    this.pendingLevelUp = null;
    this.replayEvents = [];
    this.elapsedMs = 0;
    this.lastScoreSnapshot = null;
    this.ui.setLastScore(null);
    this.ui.setReplayPreview(null);
    this.updateHud();
  }

  private consumeLiveDirections(): void {
    if (this.snakeEntity === null) return;
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    if (!snake) return;
    let direction = this.input.consumeDirection();
    while (direction) {
      setNextDirection(snake, direction);
      this.replayEvents.push({ time: this.elapsedMs, direction });
      direction = this.input.consumeDirection();
    }
  }

  private consumeReplayDirections(): void {
    if (!this.replay || this.snakeEntity === null) return;
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    if (!snake) return;
    while (
      this.replay.eventIndex < this.replay.data.events.length &&
      this.replay.data.events[this.replay.eventIndex].time <= this.elapsedMs
    ) {
      const event = this.replay.data.events[this.replay.eventIndex];
      setNextDirection(snake, event.direction);
      this.replay.eventIndex += 1;
    }
  }

  private checkLevelProgression(): void {
    if (this.phase !== 'playing' || this.snakeEntity === null) {
      return;
    }
    if (this.pendingLevelUp || this.nextLevelScoreTarget === null) {
      return;
    }
    const state = this.world.getComponent(this.snakeEntity, SnakeGameState) as
      | SnakeGameStateComponent
      | undefined;
    if (!state) return;
    if (state.score >= this.nextLevelScoreTarget) {
      const nextIndex = this.currentLevelIndex + 1;
      if (nextIndex < this.levelPresets.length) {
        this.triggerLevelUp(nextIndex, state);
      } else {
        this.nextLevelScoreTarget = null;
      }
    }
  }

  private triggerLevelUp(nextIndex: number, state: SnakeGameStateComponent): void {
    const nextPreset = this.getPresetByIndex(nextIndex);
    const currentPreset = this.getPresetByIndex(this.currentLevelIndex);
    this.pendingLevelUp = {
      index: nextIndex,
      preset: nextPreset,
      preserved: {
        score: state.score,
        comboCount: state.comboCount,
        maxCombo: state.maxCombo,
      },
    };
    this.setPhase('level-up');
    this.audio.play('level-up');
    this.shake(240, 7);
    this.ui.setLevelUpContext({
      currentLevel: currentPreset.preview,
      nextLevel: nextPreset.preview,
      score: state.score,
      combo: state.comboCount,
    });
    this.ui.setState('level-up');
  }

  private applyPendingLevelUp(): void {
    if (!this.pendingLevelUp) {
      this.setPhase('playing');
      this.ui.setState('playing');
      return;
    }
    this.audio.play('menu');
    const modeConfig = this.getModeConfig(this.currentMode);
    const { preset, preserved } = this.pendingLevelUp;
    this.pendingLevelUp = null;
    this.ui.setLevelUpContext(null);
    this.currentRunSeed = this.makeRunSeed();
    this.createRunForPreset(preset, {
      modeConfig,
      seed: this.currentRunSeed,
      preservedState: preserved,
    });
    this.setPhase('playing');
    this.ui.setState('playing');
  }

  private resume(): void {
    this.audio.play('menu');
    this.setPhase('playing');
    this.ui.setState('playing');
  }

  private restart(): void {
    if (this.replay) {
      this.startReplayFromEntry(this.replayPreviewEntry());
      return;
    }
    this.startGame(this.currentMode);
  }

  private exitToMenu(): void {
    this.audio.play('menu');
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }
    this.snakeEntity = null;
    this.replay = null;
    this.ui.setReplayStatus(null);
    this.ui.setReplayPreview(null);
    this.audio.stopMusic();
    this.stopRebindCapture();
    this.setPhase('menu');
    this.ui.setState('main-menu');
  }

  private openModeSelect(): void {
    this.exitToMenu();
  }

  private checkForGameOver(): void {
    if (this.snakeEntity === null) return;
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    const state = this.world.getComponent(this.snakeEntity, SnakeGameState);
    if (!snake || !state) return;

    if (this.modeTimeRemainingMs !== null && this.modeTimeRemainingMs <= 0) {
      snake.alive = false;
    }

    if (!snake.alive) {
      const snapshot = {
        mode: this.currentMode,
        score: state.score,
        combo: state.maxCombo,
      };
      this.lastScoreSnapshot = snapshot;
      this.ui.setLastScore(snapshot);
      if (this.phase === 'replay-playing' || this.phase === 'replay-paused') {
        if (this.replay) {
          this.replay.finished = true;
        }
        this.setPhase('replay-paused');
        return;
      }
      this.setPhase('game-over');
      this.ui.setState('game-over');
    }
  }

  private saveScore(initials: string): void {
    if (!this.lastScoreSnapshot) return;
    const uuid =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const replay: SuperSnakeReplayData = {
      version: 1,
      seed: this.currentRunSeed,
      mode: this.lastScoreSnapshot.mode,
      levelId: this.currentLevelId,
      durationMs: this.elapsedMs,
      events: this.replayEvents.map((event) => ({ ...event })),
    };
    const entry: LeaderboardEntry = {
      id: uuid,
      initials,
      score: this.lastScoreSnapshot.score,
      combo: this.lastScoreSnapshot.combo,
      mode: this.lastScoreSnapshot.mode,
      occurredAt: Date.now(),
      replay: {
        description: 'Deterministic replay payload',
        data: replay,
      },
    };
    const updated = this.leaderboard.add(entry);
    this.ui.setLeaderboard(updated);
    this.ui.setReplayPreview(entry);
    this.ui.setState('leaderboard');
    this.highScore = this.computeHighScore(updated);
    this.updateHud();
  }

  private deleteEntry(entry: LeaderboardEntry): void {
    const updated = this.leaderboard.remove(entry.id);
    this.ui.setLeaderboard(updated);
    if (this.ui.getState() === 'replay-view') {
      this.ui.setReplayPreview(null);
    }
    this.highScore = this.computeHighScore(updated);
    this.updateHud();
  }

  private startReplayFromEntry(entry: LeaderboardEntry | null): void {
    if (!entry?.replay) return;
    const parsed = parseReplayData(entry.replay.data);
    if (!parsed.valid || !parsed.replay) return;
    this.replay = {
      data: parsed.replay,
      eventIndex: 0,
      speed: 1,
      paused: false,
      finished: false,
    };
    this.currentMode = parsed.replay.mode;
    this.currentRunSeed = parsed.replay.seed;
    this.ui.setReplayPreview(entry);
    this.ui.setReplayStatus({
      title: `${entry.initials} Replay`,
      score: entry.score,
      combo: entry.combo,
      currentTimeMs: 0,
      durationMs: parsed.replay.durationMs,
      speed: 1,
      paused: false,
    });
    const presetIndex = this.findPresetIndex(parsed.replay.levelId);
    const preset = this.getPresetByIndex(presetIndex);
    const modeConfig = this.getModeConfig(parsed.replay.mode);
    this.currentLevelIndex = presetIndex;
    this.createRunForPreset(preset, {
      modeConfig,
      seed: parsed.replay.seed,
      replayMode: parsed.replay.mode,
    });
    this.audio.startMusic();
    this.setPhase('replay-playing');
    this.ui.setState('replay-view');
  }

  private stopReplay(): void {
    this.replay = null;
    this.ui.setReplayStatus(null);
    this.audio.stopMusic();
    this.openModeSelect();
    this.ui.setState('leaderboard');
  }

  private toggleReplayPause(): void {
    if (!this.replay) return;
    this.replay.paused = !this.replay.paused;
    this.setPhase(this.replay.paused ? 'replay-paused' : 'replay-playing');
    this.updateReplayStatus();
  }

  private setReplaySpeed(speed: number): void {
    if (!this.replay) return;
    this.replay.speed = speed;
    this.updateReplayStatus();
  }

  private updateReplayStatus(): void {
    if (!this.replay) return;
    this.ui.setReplayStatus({
      title: 'Replay',
      score: this.lastScoreSnapshot?.score ?? 0,
      combo: this.lastScoreSnapshot?.combo ?? 0,
      currentTimeMs: Math.min(this.elapsedMs, this.replay.data.durationMs),
      durationMs: this.replay.data.durationMs,
      speed: this.replay.speed,
      paused: this.replay.paused || this.replay.finished,
    });
    if (
      this.replay.eventIndex >= this.replay.data.events.length &&
      this.elapsedMs >= this.replay.data.durationMs &&
      !this.replay.finished
    ) {
      this.replay.finished = true;
      this.replay.paused = true;
      this.setPhase('replay-paused');
    }
  }

  private buildHudState(): {
    levelName: string;
    score: number;
    combo: number;
    highScore: number;
    activePowerUps: Array<{ id: number; icon: string; label: string; remainingMs: number }>;
    timerLabel?: string;
    modeLabel?: string;
    replaying?: boolean;
  } | null {
    if (this.snakeEntity === null) return null;
    const state = this.world.getComponent(this.snakeEntity, SnakeGameState) as
      | SnakeGameStateComponent
      | undefined;
    if (!state) return null;
    const level = this.world.getComponent(this.snakeEntity, LevelState) as
      | LevelStateComponent
      | undefined;
    const powerUps = this.world.getComponent(this.snakeEntity, PowerUpState) as
      | PowerUpStateComponent
      | undefined;
    const config = this.world.getComponent(this.snakeEntity, PowerUpConfig) as
      | PowerUpConfigComponent
      | undefined;

    const iconMap = new Map<PowerUpType, { icon: string; label: string }>();
    config?.definitions.forEach((definition) => {
      iconMap.set(definition.type, {
        icon: definition.icon,
        label: this.formatPowerUpType(definition.type),
      });
    });

    const activePowerUps =
      powerUps?.active
        .filter((entry) => entry.expiresAt > this.elapsedMs)
        .map((entry) => {
          const mapping = iconMap.get(entry.type);
          return {
            id: entry.id,
            icon: mapping?.icon ?? '✨',
            label: mapping?.label ?? this.formatPowerUpType(entry.type),
            remainingMs: Math.max(0, entry.expiresAt - this.elapsedMs),
          };
        })
        .sort((a, b) => a.remainingMs - b.remainingMs) ?? [];

    return {
      levelName: level?.levelName ?? 'Arcade',
      score: state.score,
      combo: state.comboCount,
      highScore: Math.max(this.highScore, state.score),
      activePowerUps,
      timerLabel:
        this.modeTimeRemainingMs !== null
          ? `Time ${this.formatMs(this.modeTimeRemainingMs)}`
          : this.replay
            ? `Replay ${this.formatMs(this.elapsedMs)}`
            : undefined,
      modeLabel: this.getModeConfig(this.currentMode).label,
      replaying: Boolean(this.replay),
    };
  }

  private updateHud(): void {
    this.ui.setHudState(this.buildHudState());
  }

  private syncHudWithState(): void {
    this.updateHud();
  }

  private formatPowerUpType(type: PowerUpType): string {
    switch (type) {
      case 'slow-mo':
        return 'Slow-Mo';
      case 'ghost':
        return 'Ghost';
      case 'magnet':
        return 'Magnet';
      case 'double-score':
        return 'Double Score';
      case 'shockwave':
        return 'Shockwave';
      default:
        return type;
    }
  }

  private formatMs(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private applyStoredBindings(): void {
    for (const [action, bindings] of Object.entries(this.currentSettings.bindings)) {
      if (bindings && bindings.length > 0) {
        this.input.rebind(action as ControlAction, bindings);
      }
    }
  }

  private persistBindingsSnapshot(): void {
    const nextBindings: Partial<Record<ControlAction, ActionBinding[]>> = {};
    (Object.keys(getDefaultBindings()) as ControlAction[]).forEach((action) => {
      nextBindings[action] = this.input.getBindings(action);
    });
    this.currentSettings = {
      ...this.currentSettings,
      bindings: nextBindings,
    };
    this.settingsStore.save(this.currentSettings);
    this.ui.setSettings(this.currentSettings);
  }

  private beginRebind(action: ControlAction): void {
    this.stopRebindCapture();
    this.ui.setPendingRebindAction(action);
    this.rebindListener = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.input.rebind(action, makeActionBinding(action, event.code));
      this.persistBindingsSnapshot();
      this.stopRebindCapture();
    };
    (this.context.canvas.ownerDocument?.defaultView ?? window).addEventListener(
      'keydown',
      this.rebindListener
    );
  }

  private stopRebindCapture(): void {
    if (this.rebindListener) {
      (this.context.canvas.ownerDocument?.defaultView ?? window).removeEventListener(
        'keydown',
        this.rebindListener
      );
    }
    this.rebindListener = null;
    this.ui.setPendingRebindAction(null);
  }

  private applySettings(settings: SuperSnakeSettings): void {
    this.currentSettings = settings;
    this.settingsStore.save(settings);
    this.audio.applySettings(settings.audio);
    this.ui.setSettings(settings);
    if (!settings.enabledModes.includes(this.currentMode) && this.phase === 'menu') {
      this.currentMode = settings.enabledModes[0] ?? 'classic';
    }
    this.styleCanvas(this.context.canvas);
  }

  private replayPreviewEntry(): LeaderboardEntry | null {
    const entries = this.leaderboard.load();
    const preview = entries.find((entry) => entry.id === this.ui['replayPreview']?.id);
    return preview ?? (this.ui['replayPreview'] as LeaderboardEntry | null) ?? null;
  }

  private registerUiEvents(): void {
    this.ui.on('start', ({ mode }) => this.startGame(mode));
    this.ui.on('resume', () => this.resume());
    this.ui.on('restart', () => this.restart());
    this.ui.on('openModeSelect', () => this.openModeSelect());
    this.ui.on('confirmLevelUp', () => this.applyPendingLevelUp());
    this.ui.on('exitToMenu', () => this.exitToMenu());
    this.ui.on('openSettings', () => {
      this.audio.play('menu');
      this.ui.setSettings(this.currentSettings);
      if (this.phase === 'playing') {
        this.setPhase('paused');
      }
    });
    this.ui.on('closeSettings', () => {
      this.audio.play('menu');
      this.stopRebindCapture();
      if (this.phase === 'paused') {
        this.ui.setState('paused');
      } else if (this.phase === 'menu') {
        this.ui.setState('main-menu');
      }
    });
    this.ui.on('saveInitials', ({ initials }) => this.saveScore(initials));
    this.ui.on('deleteEntry', ({ entry }) => this.deleteEntry(entry));
    this.ui.on('startReplay', ({ entry }) => this.startReplayFromEntry(entry));
    this.ui.on('stopReplay', () => {
      this.audio.play('menu');
      this.stopReplay();
    });
    this.ui.on('toggleReplayPause', () => {
      this.audio.play('menu');
      this.toggleReplayPause();
    });
    this.ui.on('setReplaySpeed', ({ speed }) => {
      this.audio.play('menu');
      this.setReplaySpeed(speed);
    });
    this.ui.on('updateSettings', ({ settings }) => this.applySettings(settings));
    this.ui.on('requestRebind', ({ action }) => this.beginRebind(action));
    this.ui.on('resetBindings', () => {
      this.input.resetBindings();
      this.currentSettings = {
        ...this.currentSettings,
        bindings: getDefaultBindings(),
      };
      this.settingsStore.save(this.currentSettings);
      this.ui.setSettings(this.currentSettings);
      this.stopRebindCapture();
    });
  }

  private computeHighScore(entries: LeaderboardEntry[]): number {
    return entries.reduce((acc, entry) => Math.max(acc, entry.score), 0);
  }

  private makeRunSeed(): number {
    return Math.floor(Math.random() * 0xffffffff);
  }

  private setPhase(phase: SuperSnakeScene['phase']): void {
    this.phase = phase;
    if (
      phase === 'playing' ||
      phase === 'paused' ||
      phase === 'replay-playing' ||
      phase === 'replay-paused'
    ) {
      this.updateHud();
    } else {
      this.ui.setHudState(null);
    }
  }
}
