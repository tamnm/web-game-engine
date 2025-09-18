import { Vec2 } from '../math/Vec2';

export interface AABB {
  position: Vec2;
  halfSize: Vec2;
}

export interface CircleCollider {
  position: Vec2;
  radius: number;
}

export const intersectsAABB = (a: AABB, b: AABB): boolean => {
  return (
    Math.abs(a.position.x - b.position.x) <= a.halfSize.x + b.halfSize.x &&
    Math.abs(a.position.y - b.position.y) <= a.halfSize.y + b.halfSize.y
  );
};

export const intersectsCircle = (a: CircleCollider, b: CircleCollider): boolean => {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const radii = a.radius + b.radius;
  return dx * dx + dy * dy <= radii * radii;
};

export const intersectsCircleAABB = (circle: CircleCollider, box: AABB): boolean => {
  const nearestX = Math.max(
    box.position.x - box.halfSize.x,
    Math.min(circle.position.x, box.position.x + box.halfSize.x)
  );
  const nearestY = Math.max(
    box.position.y - box.halfSize.y,
    Math.min(circle.position.y, box.position.y + box.halfSize.y)
  );
  const dx = circle.position.x - nearestX;
  const dy = circle.position.y - nearestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
};

export interface CollisionResolution {
  normal: Vec2;
  depth: number;
}

export const resolveAABB = (a: AABB, b: AABB): CollisionResolution | null => {
  if (!intersectsAABB(a, b)) return null;
  const dx = b.position.x - a.position.x;
  const px = b.halfSize.x + a.halfSize.x - Math.abs(dx);
  const dy = b.position.y - a.position.y;
  const py = b.halfSize.y + a.halfSize.y - Math.abs(dy);
  if (px < py) {
    const sx = Math.sign(dx) || 1;
    return { normal: { x: sx, y: 0 }, depth: px };
  }
  const sy = Math.sign(dy) || 1;
  return { normal: { x: 0, y: sy }, depth: py };
};
