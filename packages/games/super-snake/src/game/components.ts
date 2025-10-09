import type { ComponentDefinition } from '@web-game-engine/core';

export type GridMode = 'wrap' | 'solid';

export interface GridComponent {
  width: number;
  height: number;
  cellSize: number;
  mode: GridMode;
}

export const Grid: ComponentDefinition<GridComponent> = {
  name: 'super-snake.grid',
  defaults: () => ({
    width: 16,
    height: 16,
    cellSize: 32,
    mode: 'wrap',
  }),
};

export interface SnakeSegment {
  x: number;
  y: number;
}

export type SnakeDirection = 'up' | 'down' | 'left' | 'right';

export interface SnakeComponent {
  segments: SnakeSegment[];
  direction: SnakeDirection;
  nextDirection: SnakeDirection;
  pendingGrowth: number;
  alive: boolean;
}

export const Snake: ComponentDefinition<SnakeComponent> = {
  name: 'super-snake.snake',
  defaults: () => ({
    segments: [],
    direction: 'right',
    nextDirection: 'right',
    pendingGrowth: 0,
    alive: true,
  }),
};

export interface SnakeMovementComponent {
  /** How many milliseconds per cell movement. */
  moveIntervalMs: number;
  accumulatorMs: number;
}

export const SnakeMovement: ComponentDefinition<SnakeMovementComponent> = {
  name: 'super-snake.snakeMovement',
  defaults: () => ({
    moveIntervalMs: 140,
    accumulatorMs: 0,
  }),
};

export interface SnakeGameStateComponent {
  ticks: number;
  lastMoveAt: number;
  mode: GridMode;
  score: number;
  comboCount: number;
  maxCombo: number;
  lastConsumedAt: number;
}

export const SnakeGameState: ComponentDefinition<SnakeGameStateComponent> = {
  name: 'super-snake.state',
  defaults: () => ({
    ticks: 0,
    lastMoveAt: 0,
    mode: 'wrap',
    score: 0,
    comboCount: 0,
    maxCombo: 0,
    lastConsumedAt: -Infinity,
  }),
};

export type FoodRarity = 'common' | 'uncommon' | 'rare';

export interface FoodDefinition {
  id: string;
  rarity: FoodRarity;
  weight: number;
  growth: number;
  score: number;
  comboBonus?: number;
  tint: [number, number, number, number];
}

export interface FoodItem {
  id: number;
  type: string;
  x: number;
  y: number;
  spawnedAt: number;
  growth: number;
  score: number;
  comboBonus: number;
  tint: [number, number, number, number];
}

export interface FoodConfigComponent {
  definitions: FoodDefinition[];
  maxActive: number;
  spawnIntervalMs: number;
  comboWindowMs: number;
  /** Optional deterministic random generator primarily for tests. */
  random?: () => number;
}

export const FoodConfig: ComponentDefinition<FoodConfigComponent> = {
  name: 'super-snake.foodConfig',
  defaults: () => ({
    definitions: [
      {
        id: 'apple',
        rarity: 'common',
        weight: 7,
        growth: 1,
        score: 10,
        comboBonus: 0,
        tint: [0.85, 0.2, 0.2, 1],
      },
      {
        id: 'berry',
        rarity: 'uncommon',
        weight: 3,
        growth: 2,
        score: 25,
        comboBonus: 1,
        tint: [0.2, 0.4, 0.9, 1],
      },
      {
        id: 'starfruit',
        rarity: 'rare',
        weight: 1,
        growth: 3,
        score: 75,
        comboBonus: 2,
        tint: [0.95, 0.85, 0.2, 1],
      },
    ],
    maxActive: 3,
    spawnIntervalMs: 2000,
    comboWindowMs: 4000,
    random: undefined,
  }),
};

export interface FoodStateComponent {
  items: FoodItem[];
  lastSpawnAt: number;
  nextId: number;
}

export const FoodState: ComponentDefinition<FoodStateComponent> = {
  name: 'super-snake.foodState',
  defaults: () => ({
    items: [],
    lastSpawnAt: -Infinity,
    nextId: 1,
  }),
};

export type SnakeGameMode = 'classic' | 'timed' | 'endless' | 'challenge';

export type PowerUpType = 'slow-mo' | 'ghost' | 'magnet' | 'double-score';

export interface PowerUpEffectConfig {
  /** Multiplies the movement interval when slow-mo is active. >1 slows the snake. */
  speedMultiplier?: number;
  /** Enables passing through self collisions when true. */
  ghostPhase?: boolean;
  /** Additional multiplier applied to score gains. */
  scoreMultiplier?: number;
  /** Manhattan distance range for magnetised food spawns. */
  magnetRange?: number;
}

export interface PowerUpDefinition {
  id: string;
  type: PowerUpType;
  weight: number;
  durationMs: number;
  effect: PowerUpEffectConfig;
  tint: [number, number, number, number];
  icon: string;
}

export interface PowerUpItem {
  id: number;
  definitionId: string;
  type: PowerUpType;
  x: number;
  y: number;
  spawnedAt: number;
  tint: [number, number, number, number];
  icon: string;
}

export interface ActivePowerUp {
  id: number;
  type: PowerUpType;
  expiresAt: number;
  effect: PowerUpEffectConfig;
}

export interface PowerUpConfigComponent {
  definitions: PowerUpDefinition[];
  maxActive: number;
  spawnIntervalMs: number;
  initialDelayMs: number;
  random?: () => number;
}

export const PowerUpConfig: ComponentDefinition<PowerUpConfigComponent> = {
  name: 'super-snake.powerUpConfig',
  defaults: () => ({
    definitions: [
      {
        id: 'slow-mo',
        type: 'slow-mo',
        weight: 3,
        durationMs: 6000,
        effect: {
          speedMultiplier: 1.8,
        },
        tint: [0.25, 0.65, 0.95, 1],
        icon: '🐢',
      },
      {
        id: 'ghost',
        type: 'ghost',
        weight: 2,
        durationMs: 5000,
        effect: {
          ghostPhase: true,
        },
        tint: [0.7, 0.8, 0.95, 1],
        icon: '👻',
      },
      {
        id: 'magnet',
        type: 'magnet',
        weight: 2,
        durationMs: 7000,
        effect: {
          magnetRange: 4,
        },
        tint: [0.9, 0.6, 0.15, 1],
        icon: '🧲',
      },
      {
        id: 'double-score',
        type: 'double-score',
        weight: 2,
        durationMs: 8000,
        effect: {
          scoreMultiplier: 2,
        },
        tint: [0.95, 0.3, 0.6, 1],
        icon: '✨',
      },
    ],
    maxActive: 1,
    spawnIntervalMs: 12000,
    initialDelayMs: 6000,
    random: undefined,
  }),
};

export interface PowerUpStateComponent {
  items: PowerUpItem[];
  active: ActivePowerUp[];
  lastSpawnAt: number;
  nextId: number;
}

export const PowerUpState: ComponentDefinition<PowerUpStateComponent> = {
  name: 'super-snake.powerUpState',
  defaults: () => ({
    items: [],
    active: [],
    lastSpawnAt: -Infinity,
    nextId: 1,
  }),
};
