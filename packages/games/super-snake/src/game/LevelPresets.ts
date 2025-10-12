import type { LevelDefinition, LevelThemeDefinition } from './components';
import { generateAuroraLayout, generateEmberLayout, generateMidnightLayout } from './Level';

export interface LevelPreview {
  id: string;
  name: string;
  description: string;
  difficulty: 'Chill' | 'Moderate' | 'Intense';
  hazardSummary: string;
  cardAccent: string;
  cardBackground: string;
}

export interface LevelProgressionConfig {
  /** Minimum score at which this level becomes available. */
  entryScore: number;
  /** Score required to advance to the next level (null when final). */
  nextScoreThreshold: number | null;
  /** Multiplier applied to snake move interval (lower = faster). */
  moveIntervalMultiplier: number;
  /** Multiplier applied to food spawn interval (lower = more frequent). */
  foodSpawnIntervalMultiplier: number;
  /** Multiplier applied to power-up spawn interval (lower = more frequent). */
  powerUpSpawnIntervalMultiplier: number;
  /** Multiplier applied to power-up initial delay timings. */
  powerUpInitialDelayMultiplier: number;
}

export interface LevelPreset {
  definition: LevelDefinition;
  preview: LevelPreview;
  progression: LevelProgressionConfig;
}

const GRID_WIDTH = 20;
const GRID_HEIGHT = 16;

function cloneTheme(theme: LevelThemeDefinition): LevelThemeDefinition {
  return { ...theme };
}

function makeLevelDefinition(
  id: string,
  name: string,
  theme: LevelThemeDefinition,
  obstacles: LevelDefinition['obstacles'],
  hazards: LevelDefinition['hazards']
): LevelDefinition {
  return {
    id,
    name,
    theme: cloneTheme(theme),
    obstacles: obstacles.map((cell) => ({ ...cell })),
    hazards: hazards.map((hazard) => ({
      ...hazard,
      path: hazard.path.map((cell) => ({ ...cell })),
    })),
  };
}

const auroraTheme: LevelThemeDefinition = {
  id: 'aurora',
  backgroundColor: '#041924',
  gridLineColor: 'rgba(255, 255, 255, 0.06)',
  snakeBodyColor: '#74f7b4',
  snakeHeadColor: '#c6ffe0',
  obstacleColor: '#1b2f3c',
  hazardColor: '#f26c6c',
  hazardIcon: '✴️',
  overlayColor: 'rgba(36, 23, 58, 0.2)',
  cardAccent: '#74f7b4',
  cardBackground: '#0a2331',
};

const emberTheme: LevelThemeDefinition = {
  id: 'ember-dunes',
  backgroundColor: '#2d0d0d',
  gridLineColor: 'rgba(255, 194, 102, 0.12)',
  snakeBodyColor: '#ffb347',
  snakeHeadColor: '#ffd194',
  obstacleColor: '#5f2c1f',
  hazardColor: '#ff6b35',
  hazardIcon: '🔥',
  overlayColor: 'rgba(191, 64, 64, 0.25)',
  cardAccent: '#ff6b35',
  cardBackground: '#3a1412',
};

const midnightTheme: LevelThemeDefinition = {
  id: 'midnight-market',
  backgroundColor: '#081129',
  gridLineColor: 'rgba(100, 180, 255, 0.12)',
  snakeBodyColor: '#7df9ff',
  snakeHeadColor: '#f8faff',
  obstacleColor: '#14203b',
  hazardColor: '#ff4ecd',
  hazardIcon: '🛸',
  overlayColor: 'rgba(25, 9, 40, 0.3)',
  cardAccent: '#ff4ecd',
  cardBackground: '#101b38',
};

const auroraLayout = generateAuroraLayout(GRID_WIDTH, GRID_HEIGHT, 'aurora');
const emberLayout = generateEmberLayout(GRID_WIDTH, GRID_HEIGHT);
const midnightLayout = generateMidnightLayout(GRID_WIDTH, GRID_HEIGHT);

export const DEFAULT_LEVEL_PRESETS: LevelPreset[] = [
  {
    definition: makeLevelDefinition(
      'aurora-garden',
      'Aurora Garden',
      auroraTheme,
      auroraLayout.obstacles,
      auroraLayout.hazards
    ),
    preview: {
      id: 'aurora-garden',
      name: 'Aurora Garden',
      description: 'Glide under shimmering skies with wide turns and gentle pacing.',
      difficulty: 'Chill',
      hazardSummary: 'Slow sweeping beams carve lanes through the snow.',
      cardAccent: auroraTheme.cardAccent ?? '#74f7b4',
      cardBackground: auroraTheme.cardBackground ?? '#0a2331',
    },
    progression: {
      entryScore: 0,
      nextScoreThreshold: 350,
      moveIntervalMultiplier: 0.94,
      foodSpawnIntervalMultiplier: 0.95,
      powerUpSpawnIntervalMultiplier: 0.92,
      powerUpInitialDelayMultiplier: 0.9,
    },
  },
  {
    definition: makeLevelDefinition(
      'ember-dunes',
      'Ember Dunes',
      emberTheme,
      emberLayout.obstacles,
      emberLayout.hazards
    ),
    preview: {
      id: 'ember-dunes',
      name: 'Ember Dunes',
      description: 'Navigate scorched dunes where vents burst without warning.',
      difficulty: 'Moderate',
      hazardSummary: 'Pulsing lava vents and a sweeping sandstorm demand quick reroutes.',
      cardAccent: emberTheme.cardAccent ?? '#ff6b35',
      cardBackground: emberTheme.cardBackground ?? '#3a1412',
    },
    progression: {
      entryScore: 350,
      nextScoreThreshold: 850,
      moveIntervalMultiplier: 0.9,
      foodSpawnIntervalMultiplier: 0.9,
      powerUpSpawnIntervalMultiplier: 0.88,
      powerUpInitialDelayMultiplier: 0.85,
    },
  },
  {
    definition: makeLevelDefinition(
      'midnight-market',
      'Midnight Market',
      midnightTheme,
      midnightLayout.obstacles,
      midnightLayout.hazards
    ),
    preview: {
      id: 'midnight-market',
      name: 'Midnight Market',
      description: 'Dash through neon alleys while delivery drones orbit the plaza.',
      difficulty: 'Intense',
      hazardSummary: 'Orbiting drones and rapid lane sweeps keep the heat on.',
      cardAccent: midnightTheme.cardAccent ?? '#ff4ecd',
      cardBackground: midnightTheme.cardBackground ?? '#101b38',
    },
    progression: {
      entryScore: 850,
      nextScoreThreshold: null,
      moveIntervalMultiplier: 0.85,
      foodSpawnIntervalMultiplier: 0.85,
      powerUpSpawnIntervalMultiplier: 0.8,
      powerUpInitialDelayMultiplier: 0.8,
    },
  },
];
