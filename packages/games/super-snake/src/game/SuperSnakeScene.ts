import { Scene, World } from '@web-game-engine/core';
import {
  FoodState,
  Grid,
  GridComponent,
  Snake,
  SnakeComponent,
  SnakeMovement,
  SnakeMovementComponent,
  SnakeGameState,
  SnakeGameStateComponent,
  SnakeSegment,
  SnakeGameMode,
  FoodConfig,
  FoodConfigComponent,
  PowerUpState,
  PowerUpStateComponent,
  PowerUpConfig,
  PowerUpConfigComponent,
  PowerUpType,
  LevelState,
  LevelStateComponent,
} from './components';
import { createSnakeMovementSystem } from './systems/SnakeMovementSystem';
import { createFoodSystem } from './systems/FoodSystem';
import { createPowerUpSystem } from './systems/PowerUpSystem';
import { createHazardSystem } from './systems/HazardSystem';
import { spawnSuperSnake, SuperSnakeOptions } from './factory';
import { SuperSnakeInput, SuperSnakeInputOptions } from './input';
import { setNextDirection } from './Snake';
import { SuperSnakeUI, SuperSnakeUIOptions } from './ui/SuperSnakeUI';
import { LeaderboardStorage, LeaderboardEntry } from './ui/LeaderboardStorage';
import { DEFAULT_LEVEL_PRESETS, LevelPreset } from './LevelPresets';

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

export interface SuperSnakeSceneOptions extends SuperSnakeOptions {
  context: CanvasRenderingContext2D;
  input?: SuperSnakeInputOptions;
  ui?: SuperSnakeUIOptions;
  leaderboard?: {
    storageKey?: string;
    maxEntries?: number;
    storage?: Storage;
  };
  levels?: LevelPreset[];
  defaultLevelId?: string;
}

export class SuperSnakeScene extends Scene {
  private readonly movementSystemId = 'super-snake.systems.snake-movement';
  private readonly foodSystemId = 'super-snake.systems.food';
  private readonly hazardSystemId = 'super-snake.systems.hazards';
  private readonly powerUpSystemId = 'super-snake.systems.power-ups';
  private readonly context: CanvasRenderingContext2D;
  private readonly options: SuperSnakeOptions;
  private readonly input: SuperSnakeInput;
  private readonly ui: SuperSnakeUI;
  private readonly leaderboard: LeaderboardStorage;
  private readonly levelPresets: LevelPreset[];
  private highScore = 0;
  private snakeEntity: number | null = null;
  private devicePixelRatio = 1;
  private phase: 'menu' | 'playing' | 'paused' | 'game-over' | 'level-up' = 'menu';
  private currentMode: SnakeGameMode = 'classic';
  private currentLevelId: string;
  private currentLevelIndex = 0;
  private nextLevelScoreTarget: number | null = null;
  private pendingLevelUp: {
    index: number;
    preset: LevelPreset;
    preserved: {
      score: number;
      comboCount: number;
      maxCombo: number;
    };
  } | null = null;
  private replayEvents: Array<{ time: number; direction: SnakeComponent['direction'] }> = [];
  private elapsedMs = 0;
  private lastScoreSnapshot: { mode: SnakeGameMode; score: number; combo: number } | null = null;

  constructor(
    world: World,
    { context, input, ui, leaderboard, levels, defaultLevelId, ...options }: SuperSnakeSceneOptions
  ) {
    super('super-snake.scene', world);
    this.context = context;
    this.levelPresets = levels ?? DEFAULT_LEVEL_PRESETS;
    const derivedDefinitions =
      options.levelDefinitions?.map(cloneLevelDefinition) ??
      this.levelPresets.map((preset) => cloneLevelDefinition(preset.definition));
    const fallbackLevelId =
      derivedDefinitions[0]?.id ?? this.levelPresets[0]?.definition.id ?? 'aurora-garden';
    const initialLevelId = options.levelId ?? defaultLevelId ?? fallbackLevelId;
    this.currentLevelId = initialLevelId;
    this.currentLevelIndex = this.findPresetIndex(initialLevelId);
    const initialPreset = this.levelPresets[this.currentLevelIndex] ?? this.levelPresets[0];
    this.nextLevelScoreTarget = initialPreset?.progression.nextScoreThreshold ?? null;
    this.options = {
      ...options,
      levelDefinitions: derivedDefinitions,
      levelId: initialLevelId,
    };
    this.devicePixelRatio = (globalThis as { devicePixelRatio?: number }).devicePixelRatio ?? 1;
    this.input = new SuperSnakeInput(input);
    this.leaderboard = new LeaderboardStorage(leaderboard);
    const uiOptions: SuperSnakeUIOptions = {
      container: context.canvas.parentElement ?? undefined,
      ...ui,
    };
    uiOptions.levels = undefined;
    this.ui = new SuperSnakeUI(uiOptions);
    this.styleCanvas(context.canvas);
    this.ui.setState('main-menu');
    const initialEntries = this.leaderboard.load();
    this.highScore = this.computeHighScore(initialEntries);
    this.ui.setLeaderboard(initialEntries);
    this.registerUiEvents();
    this.input.onPause(() => {
      if (this.phase === 'playing') {
        this.setPhase('paused');
        this.ui.setState('paused');
      } else if (this.phase === 'paused') {
        this.resume();
      }
    });
  }

  private findPresetIndex(levelId: string): number {
    const index = this.levelPresets.findIndex((preset) => preset.definition.id === levelId);
    return index >= 0 ? index : 0;
  }

  private getPresetByIndex(index: number): LevelPreset {
    return this.levelPresets[index] ?? this.levelPresets[0];
  }

  private updateNextLevelScoreTarget(preset: LevelPreset): void {
    this.nextLevelScoreTarget = preset.progression.nextScoreThreshold;
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
    this.ui.dispose();
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }
    this.snakeEntity = null;
  }

  override update(delta: number): void {
    if (this.phase === 'menu' || this.phase === 'game-over') {
      return;
    }
    if (this.phase === 'paused' || this.phase === 'level-up') {
      this.input.update();
      return;
    }
    this.input.update();
    if (this.snakeEntity !== null) {
      const snake = this.world.getComponent(this.snakeEntity, Snake);
      if (snake) {
        let direction = this.input.consumeDirection();
        while (direction) {
          setNextDirection(snake, direction);
          this.replayEvents.push({ time: this.elapsedMs, direction });
          direction = this.input.consumeDirection();
        }
      }
    }
    this.elapsedMs += delta;
    this.world.step(delta);
    this.syncHudWithState();
    this.checkLevelProgression();
    this.checkForGameOver();
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
    if (!grid || !snake || !food) {
      return;
    }

    this.ensureCanvasSize(grid.width, grid.height, grid.cellSize);
    const ctx = this.context;
    const canvas = ctx.canvas;
    const logicalWidth = grid.width * grid.cellSize;
    const logicalHeight = grid.height * grid.cellSize;

    ctx.save();
    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    const theme = level?.theme;
    ctx.fillStyle = theme?.backgroundColor ?? '#051622';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Draw grid lines for clarity while prototyping.
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

    // Draw food before snake so the snake overlaps when on top.
    food.items.forEach((item) => {
      const color = item.tint;
      const [r, g, b, a] = color;
      ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      const padding = 6;
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
        ctx.beginPath();
        ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.stroke();
        const fontSize = Math.max(16, Math.floor(grid.cellSize * 0.55));
        ctx.font = `${fontSize}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.icon, centerX, centerY);
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
        const dormant = hazard.active === false;
        ctx.beginPath();
        ctx.fillStyle = hazardColor;
        ctx.globalAlpha = hazardsDisabled || dormant ? 0.25 : 0.8;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        if (hazardsDisabled) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (dormant) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
        const iconSize = Math.max(16, Math.floor(grid.cellSize * 0.6));
        ctx.font = `${iconSize}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hazardsDisabled || dormant ? 'rgba(255, 255, 255, 0.6)' : '#ffffff';
        ctx.fillText(hazardIcon, centerX, centerY);
      });
    }

    // Draw snake body.
    const bodyColor = theme?.snakeBodyColor ?? '#2ecc71';
    const headColor = theme?.snakeHeadColor ?? '#ffffff';
    snake.segments.forEach((segment, index) => {
      const padding = index === 0 ? 2 : 4;
      const size = grid.cellSize - padding * 2;
      const x = segment.x * grid.cellSize + padding;
      const y = segment.y * grid.cellSize + padding;
      ctx.fillStyle = index === 0 ? headColor : bodyColor;
      ctx.fillRect(x, y, size, size);
    });

    if (!snake.alive) {
      ctx.fillStyle = 'rgba(255, 64, 64, 0.35)';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    if (theme?.overlayColor) {
      ctx.fillStyle = theme.overlayColor;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    ctx.restore();

    // Ensure CSS size matches logical size for layout flow.
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
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

  private computeHighScore(entries: LeaderboardEntry[]): number {
    return entries.reduce((acc, entry) => Math.max(acc, entry.score), 0);
  }

  private buildHudState(): {
    levelName: string;
    score: number;
    combo: number;
    highScore: number;
    activePowerUps: Array<{
      id: number;
      icon: string;
      label: string;
      remainingMs: number;
    }>;
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
    };
  }

  private updateHud(): void {
    this.ui.setHudState(this.buildHudState());
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

  getDebugState(): {
    grid: GridComponent;
    snake: {
      alive: boolean;
      direction: SnakeComponent['direction'];
      nextDirection: SnakeComponent['direction'];
      segments: SnakeSegment[];
    };
    food: {
      items: { id: number; type: string; x: number; y: number }[];
    };
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
              icon: item.icon,
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
      },
    };
  }

  private checkForGameOver(): void {
    if (this.phase !== 'playing' || this.snakeEntity === null) return;
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    if (!snake) return;
    if (!snake.alive) {
      const state = this.world.getComponent(this.snakeEntity, SnakeGameState);
      if (!state) return;
      const snapshot = {
        mode: this.currentMode,
        score: state.score,
        combo: state.maxCombo,
      };
      this.lastScoreSnapshot = snapshot;
      this.ui.setLastScore(snapshot);
      this.setPhase('game-over');
      this.ui.setState('game-over');
    }
  }

  private syncHudWithState(): void {
    if (this.snakeEntity === null) {
      return;
    }
    this.updateHud();
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
    if (!state) {
      return;
    }
    if (state.score >= this.nextLevelScoreTarget) {
      const nextIndex = this.currentLevelIndex + 1;
      if (nextIndex < this.levelPresets.length) {
        this.triggerLevelUp(nextIndex, state);
      } else {
        this.nextLevelScoreTarget = null;
      }
    }
  }

  private createRunForPreset(
    preset: LevelPreset,
    options: { preservedState?: { score: number; comboCount: number; maxCombo: number } } = {}
  ): void {
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }
    this.currentLevelId = preset.definition.id;
    this.currentLevelIndex = this.findPresetIndex(this.currentLevelId);
    const spawnOptions = { ...this.options, levelId: this.currentLevelId };
    this.snakeEntity = spawnSuperSnake(this.world, spawnOptions);

    const movement = this.world.getComponent(this.snakeEntity, SnakeMovement) as
      | SnakeMovementComponent
      | undefined;
    if (movement) {
      movement.moveIntervalMs = Math.max(
        16,
        Math.round(movement.moveIntervalMs * preset.progression.moveIntervalMultiplier)
      );
      movement.accumulatorMs = 0;
    }

    const foodConfig = this.world.getComponent(this.snakeEntity, FoodConfig) as
      | FoodConfigComponent
      | undefined;
    if (foodConfig) {
      foodConfig.spawnIntervalMs = Math.max(
        250,
        Math.round(foodConfig.spawnIntervalMs * preset.progression.foodSpawnIntervalMultiplier)
      );
    }

    const powerUpConfig = this.world.getComponent(this.snakeEntity, PowerUpConfig) as
      | PowerUpConfigComponent
      | undefined;
    if (powerUpConfig) {
      powerUpConfig.spawnIntervalMs = Math.max(
        1000,
        Math.round(
          powerUpConfig.spawnIntervalMs * preset.progression.powerUpSpawnIntervalMultiplier
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

    this.updateNextLevelScoreTarget(preset);
    this.pendingLevelUp = null;
    this.replayEvents = [];
    this.elapsedMs = 0;
    this.lastScoreSnapshot = null;
    this.ui.setLastScore(null);
    this.ui.setReplayPreview(null);
    this.updateHud();
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
    this.ui.setLevelUpContext({
      currentLevel: currentPreset.preview,
      nextLevel: nextPreset.preview,
      score: state.score,
      combo: state.comboCount,
    });
    this.ui.setState('level-up');
  }

  startGame(mode: SnakeGameMode): void {
    this.currentMode = mode;
    const presetIndex = this.currentLevelIndex;
    const preset = this.getPresetByIndex(presetIndex);
    this.currentLevelIndex = presetIndex;
    this.pendingLevelUp = null;
    this.ui.setLevelUpContext(null);
    this.createRunForPreset(preset);
    this.setPhase('playing');
    this.ui.setState('playing');
  }

  private applyPendingLevelUp(): void {
    if (!this.pendingLevelUp) {
      if (this.phase === 'level-up') {
        this.setPhase('playing');
        this.ui.setState('playing');
      }
      return;
    }
    const { preset, preserved } = this.pendingLevelUp;
    this.pendingLevelUp = null;
    this.ui.setLevelUpContext(null);
    this.createRunForPreset(preset, { preservedState: preserved });
    this.setPhase('playing');
    this.ui.setState('playing');
  }

  private restart(): void {
    this.startGame(this.currentMode);
  }

  private resume(): void {
    this.setPhase('playing');
    this.ui.setState('playing');
  }

  private exitToMenu(): void {
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }
    this.snakeEntity = null;
    this.setPhase('menu');
    this.ui.setState('main-menu');
  }

  private saveScore(initials: string): void {
    if (!this.lastScoreSnapshot) return;
    const uuid =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const entry: LeaderboardEntry = {
      id: uuid,
      initials,
      score: this.lastScoreSnapshot.score,
      combo: this.lastScoreSnapshot.combo,
      mode: this.lastScoreSnapshot.mode,
      occurredAt: Date.now(),
      replay: {
        description: 'Direction events recorded during run',
        data: {
          mode: this.lastScoreSnapshot.mode,
          events: this.replayEvents,
          durationMs: this.elapsedMs,
        },
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

  private openModeSelect(): void {
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }
    this.snakeEntity = null;
    this.pendingLevelUp = null;
    this.ui.setLevelUpContext(null);
    const preset = this.getPresetByIndex(this.currentLevelIndex);
    this.updateNextLevelScoreTarget(preset);
    this.replayEvents = [];
    this.elapsedMs = 0;
    this.lastScoreSnapshot = null;
    this.setPhase('menu');
    this.ui.setLastScore(null);
    this.ui.setReplayPreview(null);
    this.ui.setState('main-menu');
  }

  private registerUiEvents(): void {
    this.ui.on('start', ({ mode }) => this.startGame(mode));
    this.ui.on('resume', () => this.resume());
    this.ui.on('restart', () => this.restart());
    this.ui.on('openModeSelect', () => this.openModeSelect());
    this.ui.on('confirmLevelUp', () => this.applyPendingLevelUp());
    this.ui.on('exitToMenu', () => this.exitToMenu());
    this.ui.on('openSettings', () => {
      if (this.phase === 'playing') {
        this.setPhase('paused');
      }
    });
    this.ui.on('closeSettings', () => {
      if (this.phase === 'playing') {
        this.ui.setState('playing');
      } else if (this.phase === 'menu') {
        this.ui.setState('main-menu');
      }
    });
    this.ui.on('saveInitials', ({ initials }) => this.saveScore(initials));
    this.ui.on('deleteEntry', ({ entry }) => this.deleteEntry(entry));
    this.ui.on('viewReplay', ({ entry }) => this.ui.setReplayPreview(entry));
  }

  private setPhase(phase: typeof this.phase): void {
    this.phase = phase;
    if (phase === 'playing' || phase === 'paused') {
      this.updateHud();
    } else {
      this.ui.setHudState(null);
    }
  }
}
