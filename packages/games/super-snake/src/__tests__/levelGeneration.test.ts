import { describe, expect, it } from 'vitest';
import { World } from '@web-game-engine/core';
import {
  LevelConfig,
  LevelState,
  LevelStateComponent,
  LevelConfigComponent,
  LevelDefinition,
  Snake,
  SnakeComponent,
} from '../game';
import { generateEmberLayout, initializeLevelState, stepHazards } from '../game/Level';
import { createHazardSystem } from '../game/systems/HazardSystem';
import { spawnSuperSnake } from '../game/factory';

describe('Level configuration presets', () => {
  it('provides themed defaults for Super Snake', () => {
    const config = LevelConfig.defaults!();
    expect(config.levels.length).toBeGreaterThanOrEqual(3);
    const ids = config.levels.map((level) => level.id);
    expect(ids).toContain('aurora-garden');
    expect(ids).toContain('ember-dunes');
    expect(ids).toContain('midnight-market');
  });
});

describe('Hazard behaviours', () => {
  const pulseDefinition: LevelDefinition = {
    id: 'pulse-lab',
    name: 'Pulse Lab',
    theme: {
      id: 'lab',
      backgroundColor: '#0c101d',
      gridLineColor: 'rgba(255, 255, 255, 0.05)',
      snakeBodyColor: '#8cf0ff',
      snakeHeadColor: '#ffffff',
      obstacleColor: '#1d2a43',
      hazardColor: '#ff7f50',
      hazardIcon: '⚡',
      overlayColor: 'rgba(20, 32, 54, 0.25)',
      cardAccent: '#ff7f50',
      cardBackground: '#121b32',
    },
    obstacles: [],
    hazards: [
      {
        id: 'pulse',
        path: [{ x: 3, y: 3 }],
        stepIntervalMs: 1000,
        pulseDurationMs: 400,
        idleDurationMs: 600,
      },
    ],
  };

  it('toggles pulsing hazards between active and dormant states', () => {
    const config: LevelConfigComponent = {
      levels: [pulseDefinition],
      defaultLevelId: 'pulse-lab',
    };
    const state = LevelState.defaults!();
    initializeLevelState(config, state, 'pulse-lab', 0);

    const hazard = state.hazards[0];
    expect(hazard.active).toBe(true);

    stepHazards(state, 450);
    expect(hazard.active).toBe(false);

    stepHazards(state, 1200);
    expect(hazard.active).toBe(true);
  });

  it('ignores dormant hazards when evaluating collisions', () => {
    const world = new World();
    const entity = spawnSuperSnake(world, {
      gridWidth: 8,
      gridHeight: 8,
      levelDefinitions: [pulseDefinition],
      levelId: 'pulse-lab',
    });

    const level = world.getComponent(entity, LevelState) as LevelStateComponent;
    const snake = world.getComponent(entity, Snake) as SnakeComponent;
    const hazardSystem = createHazardSystem();

    // Force the hazard into its dormant window.
    stepHazards(level, 450);
    snake.segments[0].x = 3;
    snake.segments[0].y = 3;

    hazardSystem.execute({ world, delta: 0, elapsed: 450, totalTime: 450 });
    expect(snake.alive).toBe(true);

    // Advance past the idle window so the hazard reactivates.
    stepHazards(level, 1200);
    hazardSystem.execute({ world, delta: 0, elapsed: 1200, totalTime: 1200 });
    expect(snake.alive).toBe(false);
  });
});

describe('Level layout blocking', () => {
  it('ensures Ember hazards avoid dunes and spawn area', () => {
    const layout = generateEmberLayout(20, 16);
    const obstacles = new Set(layout.obstacles.map((cell) => `${cell.x},${cell.y}`));
    const spawnKey = `${Math.floor(20 / 2)},${Math.floor(16 / 2)}`;
    layout.hazards.forEach((hazard) => {
      expect(hazard.path.length).toBeGreaterThan(0);
      hazard.path.forEach((cell) => {
        const key = `${cell.x},${cell.y}`;
        expect(obstacles.has(key)).toBe(false);
        expect(key).not.toBe(spawnKey);
      });
    });
  });
});
