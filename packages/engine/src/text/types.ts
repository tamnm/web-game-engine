import { Texture } from '../rendering/types';

/**
 * Character data from a bitmap font, containing positioning and metrics information
 */
export interface CharacterData {
  readonly char: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly xOffset: number;
  readonly yOffset: number;
  readonly xAdvance: number;
}

/**
 * A bitmap font resource containing character data and atlas texture
 */
export interface BitmapFont {
  readonly id: string;
  readonly atlas: Texture;
  readonly lineHeight: number;
  readonly baseline: number;
  readonly characters: Map<string, CharacterData>;
  readonly kerningPairs: Map<string, number>;
}

/**
 * Font descriptor for loading bitmap fonts
 */
export interface FontDescriptor {
  key: string;
  fntFile: string;
  textureFiles: string[];
  loader: 'bmfont';
}

/**
 * Font manager interface for loading and managing bitmap fonts
 */
export interface FontManager {
  loadFont(descriptor: FontDescriptor): Promise<BitmapFont>;
  getFont(id: string): BitmapFont | undefined;
  releaseFont(id: string): void;
  getAvailableFonts(): string[];
}

/**
 * Text layout options for positioning and wrapping
 */
export interface TextLayoutOptions {
  font: BitmapFont;
  text: string;
  maxWidth?: number;
  horizontalAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  characterSpacing?: number;
  wordWrap: boolean;
}

/**
 * Individual character layout information
 */
export interface CharacterLayout {
  char: string;
  x: number;
  y: number;
  data: CharacterData;
}

/**
 * Text bounds rectangle
 */
export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result of text layout calculation
 */
export interface LayoutResult {
  characters: CharacterLayout[];
  bounds: TextBounds;
  lineCount: number;
}

/**
 * Line layout information
 */
export interface LineLayout {
  characters: CharacterLayout[];
  width: number;
  height: number;
  baseline: number;
}

/**
 * Internal layout state during calculation
 */
export interface LayoutState {
  lines: LineLayout[];
  currentLine: CharacterLayout[];
  currentWidth: number;
  maxWidth: number;
  wordWrap: boolean;
}

/**
 * Drop shadow styling options
 */
export interface DropShadowStyle {
  color: [number, number, number, number];
  offsetX: number;
  offsetY: number;
}

/**
 * Stroke outline styling options
 */
export interface StrokeStyle {
  color: [number, number, number, number];
  width: number;
}

/**
 * Text styling configuration
 */
export interface TextStyle {
  color: [number, number, number, number];
  maxWidth?: number;
  horizontalAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  characterSpacing?: number;
  wordWrap: boolean;
  dropShadow?: DropShadowStyle;
  stroke?: StrokeStyle;
}

/**
 * Options for creating text entities
 */
export interface TextEntityOptions {
  text: string;
  font: string;
  x: number;
  y: number;
  style?: Partial<TextStyle>;
}

/**
 * Options for text measurement
 */
export interface MeasureOptions {
  maxWidth?: number;
  lineHeight?: number;
  characterSpacing?: number;
  wordWrap?: boolean;
}
