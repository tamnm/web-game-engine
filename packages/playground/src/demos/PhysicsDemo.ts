/**
 * Physics and collision detection demo.
 * Demonstrates collision shapes, collision detection, and interactive object spawning.
 */

import { BaseDemo } from './BaseDemo.js';
import {
  World,
  GameLoop,
  Renderer,
  DevOverlay,
  Vec2,
  intersectsAABB,
  intersectsCircle,
  intersectsCircleAABB,
  resolveAABB,
} from '@web-game-engine/core';
import type {
  AABB,
  CircleCollider,
  Texture,
  ComponentDefinition,
  SystemContext,
} from '@web-game-engine/core';
import { createColorTexture, createCircleTexture } from '../utils/graphics.js';

// Component type definitions
interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

interface BoxCollider {
  halfWidth: number;
  halfHeight: number;
}

interface CircleColliderComponent {
  radius: number;
}

interface Visual {
  color: string;
  colliding: boolean;
  texture: Texture; // Store the procedural texture
}

// Component definitions for ECS
const PositionDef: ComponentDefinition<Position> = {
  name: 'Position',
  defaults: () => ({ x: 0, y: 0 }),
};

const VelocityDef: ComponentDefinition<Velocity> = {
  name: 'Velocity',
  defaults: () => ({ x: 0, y: 0 }),
};

const BoxColliderDef: ComponentDefinition<BoxCollider> = {
  name: 'BoxCollider',
  defaults: () => ({ halfWidth: 30, halfHeight: 30 }),
};

const CircleColliderDef: ComponentDefinition<CircleColliderComponent> = {
  name: 'CircleCollider',
  defaults: () => ({ radius: 25 }),
};

const VisualDef: ComponentDefinition<Visual> = {
  name: 'Visual',
  defaults: () => ({
    color: '#ffffff',
    colliding: false,
    texture: { id: 'default', width: 64, height: 64, source: null },
  }),
};

/**
 * PhysicsDemo showcases the engine's physics and collision detection capabilities.
 *
 * Features demonstrated:
 * - Different collision shapes (circles, rectangles)
 * - Visual feedback for collisions (color change)
 * - Interactive object spawning with mouse clicks
 * - Velocity and acceleration effects
 * - Collision detection and resolution
 */
export class PhysicsDemo extends BaseDemo {
  private devOverlay!: DevOverlay;
  private entities: number[] = [];
  private mousePos: Vec2 = { x: 0, y: 0 };

  async init(): Promise<void> {
    console.info('PhysicsDemo: Initializing physics and collision showcase');

    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;

    // Create ECS world
    this.world = new World() as unknown;
    const world = this.world as World;

    // Create physics system that updates positions and detects collisions
    world.registerSystem({
      id: 'physics',
      stage: 'update',
      execute: (context: SystemContext) => {
        const dt = context.delta / 1000; // Convert to seconds
        const query = world.query({ all: [PositionDef, VelocityDef] });

        // Update positions based on velocity
        for (const result of query) {
          const entity = (result as { entity: number }).entity;
          const pos = world.getComponent(entity, PositionDef)!;
          const vel = world.getComponent(entity, VelocityDef)!;

          pos.x += vel.x * dt;
          pos.y += vel.y * dt;

          // Apply gravity
          vel.y += 500 * dt; // 500 pixels/s^2 downward

          // Bounce off walls
          if (pos.x < 0 || pos.x > this.canvas.width) {
            vel.x *= -0.8; // Damping on bounce
            pos.x = Math.max(0, Math.min(this.canvas.width, pos.x));
          }
          if (pos.y > this.canvas.height) {
            vel.y *= -0.8;
            pos.y = this.canvas.height;
          }
          if (pos.y < 0) {
            vel.y *= -0.8;
            pos.y = 0;
          }
        }
      },
    });

    // Create collision detection system
    world.registerSystem({
      id: 'collision',
      stage: 'update',
      execute: () => {
        const query = world.query({ all: [PositionDef] });
        const entities = Array.from(query).map((r) => (r as { entity: number }).entity);

        // Reset collision flags
        for (const entity of entities) {
          const visual = world.getComponent(entity, VisualDef);
          if (visual) {
            visual.colliding = false;
          }
        }

        // Check all pairs for collisions
        for (let i = 0; i < entities.length; i++) {
          for (let j = i + 1; j < entities.length; j++) {
            const entityA = entities[i];
            const entityB = entities[j];

            const posA = world.getComponent(entityA, PositionDef)!;
            const posB = world.getComponent(entityB, PositionDef)!;

            const boxA = world.getComponent(entityA, BoxColliderDef);
            const boxB = world.getComponent(entityB, BoxColliderDef);
            const circleA = world.getComponent(entityA, CircleColliderDef);
            const circleB = world.getComponent(entityB, CircleColliderDef);

            let colliding = false;

            // Box-Box collision
            if (boxA && boxB) {
              const aabbA: AABB = {
                position: posA,
                halfSize: { x: boxA.halfWidth, y: boxA.halfHeight },
              };
              const aabbB: AABB = {
                position: posB,
                halfSize: { x: boxB.halfWidth, y: boxB.halfHeight },
              };
              colliding = intersectsAABB(aabbA, aabbB);

              // Resolve collision
              if (colliding) {
                const resolution = resolveAABB(aabbA, aabbB);
                if (resolution) {
                  // Push entities apart
                  posA.x -= resolution.normal.x * resolution.depth * 0.5;
                  posA.y -= resolution.normal.y * resolution.depth * 0.5;
                  posB.x += resolution.normal.x * resolution.depth * 0.5;
                  posB.y += resolution.normal.y * resolution.depth * 0.5;
                }
              }
            }
            // Circle-Circle collision
            else if (circleA && circleB) {
              const colliderA: CircleCollider = { position: posA, radius: circleA.radius };
              const colliderB: CircleCollider = { position: posB, radius: circleB.radius };
              colliding = intersectsCircle(colliderA, colliderB);
            }
            // Circle-Box collision
            else if (circleA && boxB) {
              const colliderA: CircleCollider = { position: posA, radius: circleA.radius };
              const aabbB: AABB = {
                position: posB,
                halfSize: { x: boxB.halfWidth, y: boxB.halfHeight },
              };
              colliding = intersectsCircleAABB(colliderA, aabbB);
            } else if (boxA && circleB) {
              const aabbA: AABB = {
                position: posA,
                halfSize: { x: boxA.halfWidth, y: boxA.halfHeight },
              };
              const colliderB: CircleCollider = { position: posB, radius: circleB.radius };
              colliding = intersectsCircleAABB(colliderB, aabbA);
            }

            // Mark entities as colliding for visual feedback
            if (colliding) {
              const visualA = world.getComponent(entityA, VisualDef);
              const visualB = world.getComponent(entityB, VisualDef);
              if (visualA) visualA.colliding = true;
              if (visualB) visualB.colliding = true;
            }
          }
        }
      },
    });

    // Create renderer for sprite rendering - force Canvas 2D (WebGL not implemented yet)
    this.renderer = new Renderer({
      contextProvider: () => this.canvas.getContext('2d'),
    }) as unknown;

    // Create game loop
    this.gameLoop = new GameLoop({
      onSimulationStep: (delta: number) => this.update(delta),
      onRender: () => this.render(),
      targetFPS: 60,
    }) as unknown;

    // Enable dev tools overlay
    this.devOverlay = new DevOverlay({ position: 'top-left' });
    this.devOverlay.attach();

    // Create initial entities
    this.createInitialEntities();

    // Set up mouse interaction
    this.setupMouseInteraction();

    // Start the game loop
    (this.gameLoop as GameLoop).start();

    console.info('PhysicsDemo: Initialized successfully');
  }

  /**
   * Create some initial entities to demonstrate collision detection.
   */
  private createInitialEntities(): void {
    const world = this.world as World;

    // Create a few boxes
    for (let i = 0; i < 3; i++) {
      const entity = world.createEntity();
      const size = 60;
      const texture: Texture = {
        id: `box-${i}`,
        width: size,
        height: size,
        source: createColorTexture('#4a9eff', size),
      };

      world.addComponent(entity, PositionDef, {
        x: 200 + i * 150,
        y: 100 + i * 50,
      });
      world.addComponent(entity, VelocityDef, {
        x: (Math.random() - 0.5) * 200,
        y: Math.random() * 100,
      });
      world.addComponent(entity, BoxColliderDef, {
        halfWidth: 30,
        halfHeight: 30,
      });
      world.addComponent(entity, VisualDef, {
        color: '#4a9eff',
        colliding: false,
        texture,
      });
      this.entities.push(entity);
    }

    // Create a few circles
    for (let i = 0; i < 3; i++) {
      const entity = world.createEntity();
      const size = 50;
      const texture: Texture = {
        id: `circle-${i}`,
        width: size,
        height: size,
        source: createCircleTexture('#50c878', size),
      };

      world.addComponent(entity, PositionDef, {
        x: 250 + i * 150,
        y: 200 + i * 50,
      });
      world.addComponent(entity, VelocityDef, {
        x: (Math.random() - 0.5) * 200,
        y: Math.random() * 100,
      });
      world.addComponent(entity, CircleColliderDef, {
        radius: 25,
      });
      world.addComponent(entity, VisualDef, {
        color: '#50c878',
        colliding: false,
        texture,
      });
      this.entities.push(entity);
    }
  }

  /**
   * Set up mouse interaction for spawning objects.
   */
  private setupMouseInteraction(): void {
    // Track mouse position
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
    });

    // Spawn objects on click
    this.canvas.addEventListener('click', () => {
      this.spawnObjectAtMouse();
    });
  }

  /**
   * Spawn a random object at the mouse position.
   */
  private spawnObjectAtMouse(): void {
    const world = this.world as World;
    const entity = world.createEntity();

    world.addComponent(entity, PositionDef, {
      x: this.mousePos.x,
      y: this.mousePos.y,
    });

    world.addComponent(entity, VelocityDef, {
      x: (Math.random() - 0.5) * 300,
      y: -Math.random() * 200 - 100, // Upward velocity
    });

    // Randomly choose between box and circle
    if (Math.random() < 0.5) {
      const size = 60;
      const texture: Texture = {
        id: `spawned-box-${entity}`,
        width: size,
        height: size,
        source: createColorTexture('#ff6b6b', size),
      };

      world.addComponent(entity, BoxColliderDef, {
        halfWidth: 20 + Math.random() * 20,
        halfHeight: 20 + Math.random() * 20,
      });
      world.addComponent(entity, VisualDef, {
        color: '#ff6b6b',
        colliding: false,
        texture,
      });
    } else {
      const size = 50;
      const texture: Texture = {
        id: `spawned-circle-${entity}`,
        width: size,
        height: size,
        source: createCircleTexture('#ffd93d', size),
      };

      world.addComponent(entity, CircleColliderDef, {
        radius: 15 + Math.random() * 20,
      });
      world.addComponent(entity, VisualDef, {
        color: '#ffd93d',
        colliding: false,
        texture,
      });
    }

    this.entities.push(entity);
  }

  /**
   * Override render to use the engine's proper rendering pipeline.
   */
  override render(): void {
    const renderer = this.renderer as Renderer;
    const world = this.world as World;

    // Begin rendering frame
    renderer.begin();

    // Draw all entities using the renderer
    for (const entity of this.entities) {
      const pos = world.getComponent(entity, PositionDef);
      const visual = world.getComponent(entity, VisualDef);
      const box = world.getComponent(entity, BoxColliderDef);
      const circle = world.getComponent(entity, CircleColliderDef);

      if (!pos || !visual) continue;

      // Draw using the renderer
      if (box) {
        renderer.drawSprite(visual.texture, {
          x: pos.x,
          y: pos.y,
          width: box.halfWidth * 2,
          height: box.halfHeight * 2,
        });

        // Add white overlay when colliding for visual feedback
        if (visual.colliding) {
          renderer.drawSprite(visual.texture, {
            x: pos.x,
            y: pos.y,
            width: box.halfWidth * 2,
            height: box.halfHeight * 2,
            tint: [1, 1, 1, 0.5] as [number, number, number, number],
            blend: 'additive',
          });
        }
      } else if (circle) {
        renderer.drawSprite(visual.texture, {
          x: pos.x,
          y: pos.y,
          width: circle.radius * 2,
          height: circle.radius * 2,
        });

        // Add white overlay when colliding for visual feedback
        if (visual.colliding) {
          renderer.drawSprite(visual.texture, {
            x: pos.x,
            y: pos.y,
            width: circle.radius * 2,
            height: circle.radius * 2,
            tint: [1, 1, 1, 0.5] as [number, number, number, number],
            blend: 'additive',
          });
        }
      }
    }

    // End rendering frame and get stats
    const stats = renderer.end();

    // Update dev overlay with actual render stats
    if (this.devOverlay) {
      this.devOverlay.update(stats);
    }
  }

  /**
   * Override cleanup to properly dispose physics resources.
   */
  override cleanup(): void {
    console.info('PhysicsDemo: Cleaning up resources');

    // Remove mouse event listeners
    this.canvas.removeEventListener('mousemove', () => {});
    this.canvas.removeEventListener('click', () => {});

    // Detach dev overlay
    if (this.devOverlay) {
      this.devOverlay.detach();
    }

    // Call base cleanup
    super.cleanup();
  }
}
