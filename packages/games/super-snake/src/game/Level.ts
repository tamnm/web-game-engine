import type { GridPosition } from './Grid';
import type {
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

function findNearestFreeCell(
  start: GridPosition,
  occupied: Set<string>,
  bounds: { width: number; height: number },
  avoid: Set<string> = new Set<string>()
): GridPosition | null {
  const visited = new Set<string>();
  const queue: GridPosition[] = [clonePosition(start)];
  const deltas: GridPosition[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const node = queue.shift()!;
    const key = positionKey(node);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    const withinBounds =
      node.x >= 0 && node.y >= 0 && node.x < bounds.width && node.y < bounds.height;
    if (withinBounds && !occupied.has(key) && !avoid.has(key)) {
      return node;
    }

    deltas.forEach((delta) => {
      const next = { x: node.x + delta.x, y: node.y + delta.y };
      const nextKey = positionKey(next);
      if (!visited.has(nextKey)) {
        queue.push(next);
      }
    });
  }

  return null;
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
    state.levelName = 'Unknown';
    state.obstacles = [];
    state.obstacleSet = new Set<string>();
    state.hazardDefinitions = {};
    state.hazards = [];
    state.nextHazardId = 1;
    state.hazardsDisabledUntil = -Infinity;
    return;
  }

  state.levelId = definition.id;
  state.levelName = definition.name;
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
  state.hazardsDisabledUntil = -Infinity;
}

function createHazardInstance(
  definition: LevelHazardDefinition,
  index: number,
  now: number
): HazardInstance {
  const origin = definition.path[0] ?? { x: 0, y: 0 };
  const start = clonePosition(origin);
  const pulseDuration = definition.pulseDurationMs ?? 0;
  const idleDuration = definition.idleDurationMs ?? 0;
  const hasPulse = pulseDuration > 0 && idleDuration > 0;
  return {
    id: index + 1,
    definitionId: definition.id,
    position: start,
    pathIndex: 0,
    direction: 1,
    nextMoveAt: now + definition.stepIntervalMs,
    active: true,
    nextPulseToggleAt: hasPulse ? now + pulseDuration : Number.POSITIVE_INFINITY,
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
    const definition = level.hazardDefinitions[hazard.definitionId];
    if (!definition) {
      hazard.nextMoveAt = elapsed + 1000;
      return;
    }
    const pulseDuration = definition.pulseDurationMs ?? 0;
    const idleDuration = definition.idleDurationMs ?? 0;
    const hasPulse = pulseDuration > 0 && idleDuration > 0;

    if (hasPulse) {
      const activeDuration = Math.max(1, pulseDuration);
      const idlePhaseDuration = Math.max(1, idleDuration);
      while (elapsed >= hazard.nextPulseToggleAt) {
        if (hazard.active) {
          hazard.active = false;
          hazard.nextPulseToggleAt += idlePhaseDuration;
        } else {
          hazard.active = true;
          hazard.nextPulseToggleAt += activeDuration;
        }
        if (!Number.isFinite(hazard.nextPulseToggleAt)) {
          break;
        }
      }
    } else {
      hazard.active = true;
      hazard.nextPulseToggleAt = Number.POSITIVE_INFINITY;
    }

    if (hazard.nextMoveAt > elapsed) {
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
  const maxClusters = 3;
  const obstacles = new Set<string>();
  const attemptsPerCluster = 18;
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
  rng: Rng,
  label?: string
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
        return {
          id,
          path,
          stepIntervalMs: randomInt(rng, 520, 660),
          pingPong: true,
          label,
        };
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
        return {
          id,
          path,
          stepIntervalMs: randomInt(rng, 560, 700),
          pingPong: true,
          label,
        };
      }
    }
  }
  return null;
}

export function generateAuroraLayout(
  width: number,
  height: number,
  seed: string
): { obstacles: GridPosition[]; hazards: LevelHazardDefinition[] } {
  const rng = createDeterministicRng(seed);
  const { obstacleSet } = generateObstacleClusters(width, height, rng);

  ensureSpawnClear(obstacleSet, width, height);
  const spawnKey = positionKey({
    x: Math.floor(width / 2),
    y: Math.floor(height / 2),
  });
  const hazardObstacles = new Set<string>(obstacleSet);
  hazardObstacles.add(spawnKey);

  const hazards: LevelHazardDefinition[] = [];
  const horizontal = generateSweepHazard(
    'h-sweeper',
    'horizontal',
    width,
    height,
    hazardObstacles,
    rng,
    'Glacier Drift'
  );
  if (horizontal) hazards.push(horizontal);
  const vertical = generateSweepHazard(
    'v-sweeper',
    'vertical',
    width,
    height,
    hazardObstacles,
    rng,
    'Aurora Beam'
  );
  if (vertical) hazards.push(vertical);

  return { obstacles: positionsFromSet(obstacleSet), hazards };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function addRect(
  target: Set<string>,
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: { width: number; height: number }
): void {
  for (let dy = 0; dy < height; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0 || px >= bounds.width || py >= bounds.height) continue;
      target.add(`${px},${py}`);
    }
  }
}

function positionsFromSet(set: Set<string>): GridPosition[] {
  return Array.from(set).map((key) => {
    const [x, y] = key.split(',').map((value) => Number.parseInt(value, 10));
    return { x, y };
  });
}

function ensureSpawnClear(target: Set<string>, width: number, height: number): void {
  const spawnX = Math.floor(width / 2);
  const spawnY = Math.floor(height / 2);
  target.delete(`${spawnX},${spawnY}`);
}

function createPulseHazard(
  id: string,
  position: GridPosition,
  pulseDurationMs: number,
  idleDurationMs: number,
  label: string | undefined,
  occupied: Set<string>,
  bounds: { width: number; height: number },
  avoid: Set<string>
): LevelHazardDefinition | null {
  const target = findNearestFreeCell(position, occupied, bounds, avoid);
  if (!target) {
    return null;
  }
  occupied.add(positionKey(target));
  return {
    id,
    path: [clonePosition(target)],
    stepIntervalMs: pulseDurationMs + idleDurationMs,
    pingPong: false,
    pulseDurationMs,
    idleDurationMs,
    label,
  };
}

function buildPerimeterPath(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): GridPosition[] {
  const path: GridPosition[] = [];
  for (let x = minX; x <= maxX; x += 1) path.push({ x, y: minY });
  for (let y = minY + 1; y <= maxY; y += 1) path.push({ x: maxX, y });
  for (let x = maxX - 1; x >= minX; x -= 1) path.push({ x, y: maxY });
  for (let y = maxY - 1; y > minY; y -= 1) path.push({ x: minX, y });
  const seen = new Set<string>();
  return path.filter((cell) => {
    const key = positionKey(cell);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createOrbitHazard(
  id: string,
  center: GridPosition,
  radius: number,
  bounds: { width: number; height: number },
  obstacleSet: Set<string>,
  stepIntervalMs: number,
  label?: string
): LevelHazardDefinition | null {
  const minX = clamp(center.x - radius, 1, bounds.width - 2);
  const maxX = clamp(center.x + radius, 1, bounds.width - 2);
  const minY = clamp(center.y - radius, 1, bounds.height - 2);
  const maxY = clamp(center.y + radius, 1, bounds.height - 2);
  if (minX >= maxX || minY >= maxY) return null;

  const perimeter = buildPerimeterPath(minX, minY, maxX, maxY).filter(
    (cell) => !obstacleSet.has(positionKey(cell))
  );
  if (perimeter.length <= 1) {
    return null;
  }
  return {
    id,
    path: perimeter.map((cell) => clonePosition(cell)),
    stepIntervalMs,
    pingPong: false,
    label,
  };
}

export function generateEmberLayout(
  width: number,
  height: number
): { obstacles: GridPosition[]; hazards: LevelHazardDefinition[] } {
  const bounds = { width, height };
  const dunes = new Set<string>();

  addRect(dunes, 2, 2, 4, 2, bounds);
  addRect(dunes, width - 8, 3, 4, 2, bounds);
  addRect(dunes, 3, height - 5, 3, 2, bounds);
  addRect(dunes, width - 7, height - 6, 3, 2, bounds);

  const rng = createDeterministicRng(`ember-${width}x${height}`);
  const extraPatches = 2;
  for (let i = 0; i < extraPatches; i += 1) {
    const w = randomInt(rng, 2, 3);
    const h = randomInt(rng, 1, 2);
    const x = randomInt(rng, 1, width - w - 2);
    const y = randomInt(rng, 2, height - h - 2);
    addRect(dunes, x, y, w, h, bounds);
  }

  ensureSpawnClear(dunes, width, height);

  const occupied = new Set<string>(dunes);
  const spawn = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const spawnKey = positionKey(spawn);
  occupied.add(spawnKey);
  const hazardAvoid = new Set<string>([spawnKey]);
  const hazards: LevelHazardDefinition[] = [
    createPulseHazard(
      'ember-vent-north',
      { x: Math.floor(width * 0.3), y: Math.floor(height * 0.32) },
      900,
      1100,
      'Lava Vent',
      occupied,
      bounds,
      hazardAvoid
    ),
    createPulseHazard(
      'ember-vent-east',
      { x: Math.floor(width * 0.65), y: Math.floor(height * 0.58) },
      1200,
      800,
      'Lava Vent',
      occupied,
      bounds,
      hazardAvoid
    ),
    createPulseHazard(
      'ember-vent-south',
      { x: Math.floor(width * 0.45), y: Math.floor(height * 0.78) },
      1000,
      950,
      'Lava Vent',
      occupied,
      bounds,
      hazardAvoid
    ),
  ].filter((hazard): hazard is LevelHazardDefinition => hazard !== null);

  const sweeper = generateSweepHazard(
    'ember-sandstorm',
    'horizontal',
    width,
    height,
    occupied,
    rng,
    'Sandstorm Sweep'
  );
  if (sweeper) {
    sweeper.stepIntervalMs = Math.max(420, sweeper.stepIntervalMs - 80);
    hazards.push(sweeper);
  }

  return {
    obstacles: positionsFromSet(dunes),
    hazards,
  };
}

export function generateMidnightLayout(
  width: number,
  height: number
): { obstacles: GridPosition[]; hazards: LevelHazardDefinition[] } {
  const bounds = { width, height };
  const stalls = new Set<string>();

  addRect(stalls, 2, 2, 3, 3, bounds);
  addRect(stalls, width - 5, 2, 3, 3, bounds);
  addRect(stalls, 2, height - 5, 3, 3, bounds);
  addRect(stalls, width - 5, height - 5, 3, 3, bounds);
  addRect(stalls, Math.floor(width / 2) - 5, 4, 5, 1, bounds);
  addRect(stalls, Math.floor(width / 2) + 1, 4, 5, 1, bounds);
  addRect(stalls, Math.floor(width / 2) - 5, height - 5, 5, 1, bounds);
  addRect(stalls, Math.floor(width / 2) + 1, height - 5, 5, 1, bounds);

  ensureSpawnClear(stalls, width, height);
  const spawn = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const spawnKey = positionKey(spawn);
  const hazardObstacles = new Set<string>(stalls);
  hazardObstacles.add(spawnKey);

  const hazards: LevelHazardDefinition[] = [];
  const droneA = createOrbitHazard(
    'neon-drone-west',
    { x: 4, y: Math.floor(height / 2) },
    3,
    bounds,
    hazardObstacles,
    360,
    'Courier Drone'
  );
  if (droneA) hazards.push(droneA);
  const droneB = createOrbitHazard(
    'neon-drone-east',
    { x: width - 5, y: Math.floor(height / 2) },
    3,
    bounds,
    hazardObstacles,
    380,
    'Courier Drone'
  );
  if (droneB) hazards.push(droneB);

  const plazaOrbit = createOrbitHazard(
    'neon-plaza-orbit',
    { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    4,
    bounds,
    hazardObstacles,
    440,
    'Lantern Orbit'
  );
  if (plazaOrbit) hazards.push(plazaOrbit);

  const rng = createDeterministicRng(`midnight-${width}x${height}`);
  const lane = generateSweepHazard(
    'neon-lane',
    'vertical',
    width,
    height,
    hazardObstacles,
    rng,
    'Blink Sweep'
  );
  if (lane) {
    lane.stepIntervalMs = Math.max(360, lane.stepIntervalMs - 60);
    hazards.push(lane);
  }

  ensureSpawnClear(stalls, width, height);

  return {
    obstacles: positionsFromSet(stalls),
    hazards,
  };
}
