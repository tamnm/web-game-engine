import { Scene, World } from '@web-game-engine/core';
import {
  FoodState,
  Grid,
  GridComponent,
  Snake,
  SnakeComponent,
  SnakeGameState,
  SnakeSegment,
} from './components';
import { createSnakeMovementSystem } from './systems/SnakeMovementSystem';
import { createFoodSystem } from './systems/FoodSystem';
import { spawnSuperSnake, SuperSnakeOptions } from './factory';
import { SuperSnakeInput, SuperSnakeInputOptions } from './input';
import { setNextDirection } from './Snake';

export interface SuperSnakeSceneOptions extends SuperSnakeOptions {
  context: CanvasRenderingContext2D;
  input?: SuperSnakeInputOptions;
}

export class SuperSnakeScene extends Scene {
  private readonly movementSystemId = 'super-snake.systems.snake-movement';
  private readonly foodSystemId = 'super-snake.systems.food';
  private readonly context: CanvasRenderingContext2D;
  private readonly options: SuperSnakeOptions;
  private readonly input: SuperSnakeInput;
  private snakeEntity: number | null = null;
  private devicePixelRatio = 1;

  constructor(world: World, { context, input, ...options }: SuperSnakeSceneOptions) {
    super('super-snake.scene', world);
    this.context = context;
    this.options = options;
    this.devicePixelRatio = (globalThis as { devicePixelRatio?: number }).devicePixelRatio ?? 1;
    this.input = new SuperSnakeInput(input);
  }

  override onEnter(): void {
    this.world.registerSystem(createSnakeMovementSystem());
    this.world.registerSystem(createFoodSystem());
    this.snakeEntity = spawnSuperSnake(this.world, this.options);
    if (this.snakeEntity !== null) {
      this.input.attach(this.context.canvas);
    }
  }

  override onExit(): void {
    this.world.unregisterSystem(this.movementSystemId);
    this.world.unregisterSystem(this.foodSystemId);
    this.input.detach();
    if (this.snakeEntity !== null && this.world.hasEntity(this.snakeEntity)) {
      this.world.destroyEntity(this.snakeEntity);
    }
    this.snakeEntity = null;
  }

  override update(delta: number): void {
    this.input.update();
    if (this.snakeEntity !== null) {
      const snake = this.world.getComponent(this.snakeEntity, Snake);
      if (snake) {
        let direction = this.input.consumeDirection();
        while (direction) {
          setNextDirection(snake, direction);
          direction = this.input.consumeDirection();
        }
      }
    }
    this.world.step(delta);
  }

  override render(): void {
    if (this.snakeEntity === null) return;
    const grid = this.world.getComponent(this.snakeEntity, Grid);
    const snake = this.world.getComponent(this.snakeEntity, Snake);
    const food = this.world.getComponent(this.snakeEntity, FoodState);
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
    ctx.fillStyle = '#051622';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Draw grid lines for clarity while prototyping.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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

    // Draw snake body.
    ctx.fillStyle = '#2ecc71';
    snake.segments.forEach((segment, index) => {
      const padding = index === 0 ? 2 : 4;
      const size = grid.cellSize - padding * 2;
      const x = segment.x * grid.cellSize + padding;
      const y = segment.y * grid.cellSize + padding;
      ctx.fillRect(x, y, size, size);
    });

    if (!snake.alive) {
      ctx.fillStyle = 'rgba(255, 64, 64, 0.35)';
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
    const state = this.world.getComponent(this.snakeEntity, SnakeGameState);
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
      state: {
        score: state.score,
        comboCount: state.comboCount,
        maxCombo: state.maxCombo,
      },
    };
  }
}
