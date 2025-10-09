import type { GridPosition } from './Grid';
import {
  HazardInstance,
  LevelConfigComponent,
  LevelDefinition,
  LevelHazardDefinition,
  LevelStateComponent,
} from './components';

const positionKey = (position: GridPosition): string => `${position.x},${position.y}`;

function clonePosition(position: GridPosition): GridPosition {
  return { x: position.x, y: position.y };
}

export function resolveLevel(
  config: LevelConfigComponent,
  levelId?: string
): LevelDefinition | undefined {
  const targetId = levelId ?? config.defaultLevelId;
  return config.levels.find((level) => level.id === targetId) ?? config.levels[0];
}

export function initializeLevelState(
  config: LevelConfigComponent,
  state: LevelStateComponent,
  levelId?: string,
  now: number = 0
): void {
  const definition = resolveLevel(config, levelId);
  if (!definition) {
    state.levelId = 'default';
    state.obstacles = [];
    state.obstacleSet = new Set<string>();
    state.hazardDefinitions = {};
    state.hazards = [];
    state.nextHazardId = 1;
    return;
  }

  state.levelId = definition.id;
  state.theme = { ...definition.theme };
  state.obstacles = definition.obstacles.map((cell) => clonePosition(cell));
  state.obstacleSet = new Set<string>();
  state.obstacles.forEach((cell) => state.obstacleSet.add(positionKey(cell)));

  state.hazardDefinitions = {};
  definition.hazards.forEach((hazard) => {
    const path = hazard.path.length > 0 ? hazard.path : [{ x: 0, y: 0 }];
    state.hazardDefinitions[hazard.id] = {
      ...hazard,
      path: path.map((cell) => clonePosition(cell)),
    };
  });

  state.hazards = definition.hazards.map((hazard, index) =>
    createHazardInstance(hazard, index, now)
  );
  state.nextHazardId = state.hazards.length + 1;
}

function createHazardInstance(
  definition: LevelHazardDefinition,
  index: number,
  now: number
): HazardInstance {
  const origin = definition.path[0] ?? { x: 0, y: 0 };
  const start = clonePosition(origin);
  return {
    id: index + 1,
    definitionId: definition.id,
    position: start,
    pathIndex: 0,
    direction: 1,
    nextMoveAt: now + definition.stepIntervalMs,
  };
}

export function collectBlockedCells(level: LevelStateComponent | undefined): GridPosition[] {
  if (!level) return [];
  const hazards = level.hazards.map((hazard) => clonePosition(hazard.position));
  return [...level.obstacles.map((cell) => clonePosition(cell)), ...hazards];
}

export function isObstacleCell(
  level: LevelStateComponent | undefined,
  position: GridPosition
): boolean {
  if (!level) return false;
  return level.obstacleSet.has(positionKey(position));
}

export function getHazardAtPosition(
  level: LevelStateComponent | undefined,
  position: GridPosition
): HazardInstance | undefined {
  if (!level) return undefined;
  return level.hazards.find(
    (hazard) => hazard.position.x === position.x && hazard.position.y === position.y
  );
}

export function stepHazards(level: LevelStateComponent, elapsed: number): void {
  level.hazards.forEach((hazard) => {
    if (hazard.nextMoveAt > elapsed) {
      return;
    }
    const definition = level.hazardDefinitions[hazard.definitionId];
    if (!definition) {
      hazard.nextMoveAt = elapsed + 1000;
      return;
    }
    if (definition.path.length === 0) {
      hazard.nextMoveAt = elapsed + (definition.stepIntervalMs || 1000);
      return;
    }
    if (definition.path.length === 1) {
      hazard.nextMoveAt = elapsed + definition.stepIntervalMs;
      return;
    }
    let nextIndex = hazard.pathIndex + hazard.direction;
    if (definition.pingPong !== false) {
      if (nextIndex >= definition.path.length || nextIndex < 0) {
        hazard.direction *= -1;
        nextIndex = hazard.pathIndex + hazard.direction;
      }
    } else {
      const length = definition.path.length;
      nextIndex = ((nextIndex % length) + length) % length;
    }
    hazard.pathIndex = Math.max(0, Math.min(definition.path.length - 1, nextIndex));
    const nextPosition = definition.path[hazard.pathIndex];
    hazard.position = clonePosition(nextPosition);
    hazard.nextMoveAt = elapsed + definition.stepIntervalMs;
  });
}

type Rng = () => number;

function createDeterministicRng(seed: string): Rng {
  let h1 = 1779033703 ^ seed.length;
  let h2 = 3144134277 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 597399067);
    h2 = Math.imul(h2 ^ ch, 2869860233);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 15), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 16), 3266489909);
  return () => {
    h2 = Math.imul(h2 ^ (h2 >>> 15), 2246822507);
    h2 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    return ((h2 >>> 0) / 4294967296) % 1;
  };
}

function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function isNearCenter(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): boolean {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  return Math.abs(x - cx) <= radius && Math.abs(y - cy) <= radius;
}

function generateObstacleClusters(
  width: number,
  height: number,
  rng: Rng
): { obstacles: GridPosition[]; obstacleSet: Set<string> } {
  const maxClusters = 4;
  const obstacles = new Set<string>();
  const attemptsPerCluster = 24;
  const reservedRadius = 2;
  let clusters = 0;

  while (clusters < maxClusters) {
    let placed = false;
    for (let attempt = 0; attempt < attemptsPerCluster && !placed; attempt += 1) {
      const w = randomInt(rng, 2, 3);
      const h = randomInt(rng, 2, 3);
      const x = randomInt(rng, 1, Math.max(1, width - w - 2));
      const y = randomInt(rng, 1, Math.max(1, height - h - 2));

      let blocked = false;
      for (let dy = 0; dy < h && !blocked; dy += 1) {
        for (let dx = 0; dx < w && !blocked; dx += 1) {
          const px = x + dx;
          const py = y + dy;
          const key = `${px},${py}`;
          if (obstacles.has(key) || isNearCenter(px, py, width, height, reservedRadius)) {
            blocked = true;
          }
        }
      }
      if (blocked) {
        continue;
      }
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) {
          const px = x + dx;
          const py = y + dy;
          obstacles.add(`${px},${py}`);
        }
      }
      placed = true;
      clusters += 1;
    }
    if (!placed) {
      break;
    }
  }

  const positions = Array.from(obstacles).map((key) => {
    const [x, y] = key.split(',').map((value) => Number.parseInt(value, 10));
    return { x, y };
  });

  return { obstacles: positions, obstacleSet: obstacles };
}

function generateSweepHazard(
  id: string,
  orientation: 'horizontal' | 'vertical',
  width: number,
  height: number,
  obstacleSet: Set<string>,
  rng: Rng
): LevelHazardDefinition | null {
  const attempts = 12;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (orientation === 'horizontal') {
      const y = randomInt(rng, 2, height - 3);
      const path: GridPosition[] = [];
      for (let x = 1; x < width - 1; x += 1) {
        const key = `${x},${y}`;
        if (!obstacleSet.has(key)) {
          path.push({ x, y });
        }
      }
      if (path.length > 1) {
        return { id, path, stepIntervalMs: randomInt(rng, 520, 660), pingPong: true };
      }
    } else {
      const x = randomInt(rng, 2, width - 3);
      const path: GridPosition[] = [];
      for (let y = 1; y < height - 1; y += 1) {
        const key = `${x},${y}`;
        if (!obstacleSet.has(key)) {
          path.push({ x, y });
        }
      }
      if (path.length > 1) {
        return { id, path, stepIntervalMs: randomInt(rng, 560, 700), pingPong: true };
      }
    }
  }
  return null;
}

export function generateAuroraObstacles(
  width: number,
  height: number,
  seed: string
): { obstacles: GridPosition[]; hazards: LevelHazardDefinition[] } {
  const rng = createDeterministicRng(seed);
  const { obstacles, obstacleSet } = generateObstacleClusters(width, height, rng);

  const hazards: LevelHazardDefinition[] = [];
  const horizontal = generateSweepHazard(
    'h-sweeper',
    'horizontal',
    width,
    height,
    obstacleSet,
    rng
  );
  if (horizontal) hazards.push(horizontal);
  const vertical = generateSweepHazard('v-sweeper', 'vertical', width, height, obstacleSet, rng);
  if (vertical) hazards.push(vertical);

  return { obstacles, hazards };
}
