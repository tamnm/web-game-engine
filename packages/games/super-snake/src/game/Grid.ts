import { GridComponent, GridMode, SnakeDirection } from './components';

export interface GridPosition {
  x: number;
  y: number;
}

const DIRECTION_VECTORS: Record<SnakeDirection, GridPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function directionToVector(direction: SnakeDirection): GridPosition {
  return DIRECTION_VECTORS[direction];
}

export function addPositions(a: GridPosition, b: GridPosition): GridPosition {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function isInsideGrid(position: GridPosition, grid: GridComponent): boolean {
  return position.x >= 0 && position.x < grid.width && position.y >= 0 && position.y < grid.height;
}

export function normalizePosition(position: GridPosition, grid: GridComponent): GridPosition {
  let { x, y } = position;
  x = ((x % grid.width) + grid.width) % grid.width;
  y = ((y % grid.height) + grid.height) % grid.height;
  return { x, y };
}

export function advancePosition(
  current: GridPosition,
  direction: SnakeDirection,
  grid: GridComponent,
  mode: GridMode
): { position: GridPosition; collided: boolean } {
  const delta = directionToVector(direction);
  const next = addPositions(current, delta);
  if (mode === 'wrap') {
    return { position: normalizePosition(next, grid), collided: false };
  }
  if (isInsideGrid(next, grid)) {
    return { position: next, collided: false };
  }
  return { position: next, collided: true };
}
