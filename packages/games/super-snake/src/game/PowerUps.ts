import {
  ActivePowerUp,
  FoodStateComponent,
  GridComponent,
  LevelStateComponent,
  PowerUpConfigComponent,
  PowerUpDefinition,
  PowerUpEffectConfig,
  PowerUpItem,
  PowerUpStateComponent,
  PowerUpType,
  SnakeComponent,
} from './components';
import type { GridPosition } from './Grid';
import { collectBlockedCells } from './Level';

export function selectPowerUpDefinition(
  config: PowerUpConfigComponent,
  random: () => number
): PowerUpDefinition {
  const totalWeight = config.definitions.reduce((sum, definition) => sum + definition.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Power-up definitions must have positive cumulative weight');
  }
  let threshold = random() * totalWeight;
  for (const definition of config.definitions) {
    threshold -= definition.weight;
    if (threshold <= 0) {
      return definition;
    }
  }
  return config.definitions[config.definitions.length - 1];
}

export function createPowerUpItem(
  state: PowerUpStateComponent,
  definition: PowerUpDefinition,
  position: GridPosition,
  now: number
): PowerUpItem {
  const id = state.nextId++;
  return {
    id,
    definitionId: definition.id,
    type: definition.type,
    x: position.x,
    y: position.y,
    spawnedAt: now,
    tint: [...definition.tint] as PowerUpItem['tint'],
    icon: definition.icon,
  };
}

export function computePowerUpSpawnCells(
  grid: GridComponent,
  snake: SnakeComponent,
  foods: FoodStateComponent | undefined,
  powerUps: PowerUpStateComponent,
  level?: LevelStateComponent
): GridPosition[] {
  const occupied = new Set<string>();
  snake.segments.forEach((segment) => {
    occupied.add(`${segment.x},${segment.y}`);
  });
  foods?.items.forEach((item) => {
    occupied.add(`${item.x},${item.y}`);
  });
  powerUps.items.forEach((item) => {
    occupied.add(`${item.x},${item.y}`);
  });
  if (level) {
    const blocked = collectBlockedCells(level);
    blocked.forEach((cell) => occupied.add(`${cell.x},${cell.y}`));
  }
  const cells: GridPosition[] = [];
  for (let y = 0; y < grid.height; y += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

export function purgeExpiredPowerUps(state: PowerUpStateComponent, now: number): void {
  if (state.active.length === 0) return;
  state.active = state.active.filter((entry) => entry.expiresAt > now);
}

function getActiveEntry(
  state: PowerUpStateComponent | undefined,
  type: PowerUpType,
  now: number
): ActivePowerUp | undefined {
  if (!state) return undefined;
  return state.active.find((entry) => entry.type === type && entry.expiresAt > now);
}

export function getMovementSpeedMultiplier(
  state: PowerUpStateComponent | undefined,
  now: number
): number {
  const entry = getActiveEntry(state, 'slow-mo', now);
  const multiplier = entry?.effect.speedMultiplier;
  return multiplier && multiplier > 0 ? multiplier : 1;
}

export function isGhostPhaseActive(state: PowerUpStateComponent | undefined, now: number): boolean {
  const entry = getActiveEntry(state, 'ghost', now);
  return Boolean(entry?.effect.ghostPhase);
}

export function getScoreMultiplier(state: PowerUpStateComponent | undefined, now: number): number {
  const entry = getActiveEntry(state, 'double-score', now);
  const multiplier = entry?.effect.scoreMultiplier;
  return multiplier && multiplier > 0 ? multiplier : 1;
}

export function getMagnetRange(
  state: PowerUpStateComponent | undefined,
  now: number
): number | null {
  const entry = getActiveEntry(state, 'magnet', now);
  const range = entry?.effect.magnetRange;
  return range && range > 0 ? range : null;
}

export function mergeEffectConfigs(
  target: PowerUpEffectConfig,
  source: PowerUpEffectConfig
): PowerUpEffectConfig {
  return {
    speedMultiplier: source.speedMultiplier ?? target.speedMultiplier,
    ghostPhase: source.ghostPhase ?? target.ghostPhase,
    scoreMultiplier: source.scoreMultiplier ?? target.scoreMultiplier,
    magnetRange: source.magnetRange ?? target.magnetRange,
    hazardDisableMs: source.hazardDisableMs ?? target.hazardDisableMs,
  };
}
