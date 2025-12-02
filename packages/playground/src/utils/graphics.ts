/**
 * Procedural graphics utilities for generating textures and shapes without external assets.
 * These utilities enable the playground to run without any image file dependencies.
 */

/**
 * Creates a solid color texture as a canvas element.
 * Useful for simple colored sprites and UI elements.
 *
 * @param color - CSS color string (e.g., '#ff0000', 'rgb(255, 0, 0)', 'red')
 * @param size - Width and height of the square texture in pixels
 * @returns Canvas element containing the colored texture
 *
 * @example
 * const redSquare = createColorTexture('#ff0000', 64);
 * // Use with engine's texture system
 */
export function createColorTexture(color: string, size: number = 64): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for color texture');
  }

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}

/**
 * Creates a linear gradient texture as a canvas element.
 * Useful for creating visually interesting backgrounds and effects.
 *
 * @param color1 - Start color (top-left corner)
 * @param color2 - End color (bottom-right corner)
 * @param size - Width and height of the square texture in pixels
 * @returns Canvas element containing the gradient texture
 *
 * @example
 * const blueGradient = createGradientTexture('#0066ff', '#00ccff', 64);
 */
export function createGradientTexture(
  color1: string,
  color2: string,
  size: number = 64
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for gradient texture');
  }

  // Create diagonal gradient from top-left to bottom-right
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}

/**
 * Creates a circular texture as a canvas element.
 * Ideal for particles, bullets, and other round objects.
 *
 * @param color - Fill color for the circle
 * @param size - Width and height of the square canvas (circle diameter)
 * @returns Canvas element containing the circle texture
 *
 * @example
 * const whiteCircle = createCircleTexture('#ffffff', 32);
 * // Perfect for particle effects
 */
export function createCircleTexture(color: string, size: number = 32): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for circle texture');
  }

  const radius = size / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/**
 * Creates a sequence of animation frames with varying colors.
 * Useful for demonstrating sprite animation without external sprite sheets.
 *
 * @param baseColor - Starting color in hex format (e.g., '#ff0000')
 * @param frameCount - Number of frames to generate
 * @param size - Width and height of each frame in pixels
 * @returns Array of canvas elements, one per frame
 *
 * @example
 * const frames = createAnimationFrames('#ff0000', 8, 64);
 * // Creates 8 frames with color variations for animation
 */
export function createAnimationFrames(
  baseColor: string,
  frameCount: number,
  size: number = 64
): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = [];

  // Parse base color to extract hue
  const hexMatch = baseColor.match(/^#([0-9a-f]{6})$/i);
  if (!hexMatch) {
    throw new Error('baseColor must be in hex format (#rrggbb)');
  }

  const baseHex = parseInt(hexMatch[1], 16);
  const r = (baseHex >> 16) & 0xff;
  const g = (baseHex >> 8) & 0xff;
  const b = baseHex & 0xff;

  // Convert RGB to HSL to manipulate hue
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  let h = 0;
  if (d !== 0) {
    if (max === r / 255) {
      h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g / 255) {
      h = ((b / 255 - r / 255) / d + 2) / 6;
    } else {
      h = ((r / 255 - g / 255) / d + 4) / 6;
    }
  }

  // Generate frames with hue rotation
  for (let i = 0; i < frameCount; i++) {
    const hueShift = (i / frameCount) * 60; // Rotate hue by up to 60 degrees
    const newHue = (h * 360 + hueShift) % 360 | 0;
    const color = `hsl(${newHue}, ${(s * 100) | 0}%, ${(l * 100) | 0}%)`;
    frames.push(createColorTexture(color, size));
  }

  return frames;
}

/**
 * Creates a rectangular outline texture (hollow rectangle).
 * Useful for collision shape visualization and UI borders.
 *
 * @param color - Stroke color
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @param lineWidth - Thickness of the outline
 * @returns Canvas element containing the rectangle outline
 *
 * @example
 * const outline = createRectOutline('#00ff00', 100, 50, 2);
 * // Green rectangle outline for collision visualization
 */
export function createRectOutline(
  color: string,
  width: number,
  height: number,
  lineWidth: number = 2
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for rect outline');
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(lineWidth / 2, lineWidth / 2, width - lineWidth, height - lineWidth);

  return canvas;
}

/**
 * Creates a circular outline texture (hollow circle).
 * Useful for circular collision shape visualization.
 *
 * @param color - Stroke color
 * @param size - Diameter of the circle
 * @param lineWidth - Thickness of the outline
 * @returns Canvas element containing the circle outline
 *
 * @example
 * const circleOutline = createCircleOutline('#00ff00', 64, 2);
 * // Green circle outline for collision visualization
 */
export function createCircleOutline(
  color: string,
  size: number,
  lineWidth: number = 2
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for circle outline');
  }

  const radius = size / 2 - lineWidth / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}
