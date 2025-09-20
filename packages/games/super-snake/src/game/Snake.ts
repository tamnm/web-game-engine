import { SnakeComponent, SnakeSegment } from './components';
import type { GridPosition } from './Grid';

export function initializeSnake(
  snake: SnakeComponent,
  segments: GridPosition[],
  direction: SnakeComponent['direction']
): void {
  snake.segments = segments.map(({ x, y }) => ({ x, y }));
  snake.direction = direction;
  snake.nextDirection = direction;
  snake.pendingGrowth = Math.max(0, snake.pendingGrowth);
  snake.alive = true;
}

export function getHead(snake: SnakeComponent): SnakeSegment {
  if (snake.segments.length === 0) {
    throw new Error('Snake has no segments');
  }
  return snake.segments[0];
}

export function occupiesPosition(snake: SnakeComponent, position: GridPosition): boolean {
  return snake.segments.some((segment) => segment.x === position.x && segment.y === position.y);
}

export function willSelfCollide(snake: SnakeComponent, nextHead: GridPosition): boolean {
  // Skip last segment if we are moving without growing because tail moves away
  const skipTail = snake.pendingGrowth === 0 ? snake.segments.length - 1 : snake.segments.length;
  return snake.segments
    .slice(0, skipTail)
    .some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
}

export function stepSnake(
  snake: SnakeComponent,
  nextHead: GridPosition
): { tail: SnakeSegment | null; grew: boolean } {
  const newHead: SnakeSegment = { x: nextHead.x, y: nextHead.y };
  snake.segments.unshift(newHead);
  let tail: SnakeSegment | null = null;
  let grew = false;
  if (snake.pendingGrowth > 0) {
    snake.pendingGrowth -= 1;
    grew = true;
  } else {
    tail = snake.segments.pop() ?? null;
  }
  return { tail, grew };
}

export function setNextDirection(
  snake: SnakeComponent,
  direction: SnakeComponent['direction']
): void {
  const opposite: Record<SnakeComponent['direction'], SnakeComponent['direction']> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  if (snake.segments.length <= 1 || direction !== opposite[snake.direction]) {
    snake.nextDirection = direction;
  }
}

export function applyNextDirection(snake: SnakeComponent): SnakeComponent['direction'] {
  snake.direction = snake.nextDirection;
  return snake.direction;
}
