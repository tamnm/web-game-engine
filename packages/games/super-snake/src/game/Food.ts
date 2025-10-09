import {
  FoodConfigComponent,
  FoodDefinition,
  FoodItem,
  FoodStateComponent,
  GridComponent,
  SnakeComponent,
} from './components';
import type { GridPosition } from './Grid';

export function selectFoodDefinition(
  config: FoodConfigComponent,
  random: () => number
): FoodDefinition {
  const definitions = config.definitions;
  const totalWeight = definitions.reduce((sum, def) => sum + def.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Food definitions must have positive cumulative weight');
  }
  const threshold = random() * totalWeight;
  let accumulator = 0;
  for (const definition of definitions) {
    accumulator += definition.weight;
    if (threshold <= accumulator) {
      return definition;
    }
  }
  return definitions[definitions.length - 1];
}

export function computeAvailableCells(
  grid: GridComponent,
  snake: SnakeComponent,
  foods: FoodStateComponent,
  extraBlocked: Iterable<GridPosition> = []
): GridPosition[] {
  const occupied = new Set<string>();
  snake.segments.forEach((segment) => {
    occupied.add(`${segment.x},${segment.y}`);
  });
  foods.items.forEach((item) => {
    occupied.add(`${item.x},${item.y}`);
  });
  for (const cell of extraBlocked) {
    occupied.add(`${cell.x},${cell.y}`);
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

export function createFoodItem(
  state: FoodStateComponent,
  definition: FoodDefinition,
  position: GridPosition,
  now: number
): FoodItem {
  const id = state.nextId++;
  return {
    id,
    type: definition.id,
    x: position.x,
    y: position.y,
    spawnedAt: now,
    growth: definition.growth,
    score: definition.score,
    comboBonus: definition.comboBonus ?? 0,
    tint: [...definition.tint] as FoodItem['tint'],
  };
}
