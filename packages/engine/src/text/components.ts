import { ComponentDefinition } from '../ecs/types';
import { LayoutResult, DropShadowStyle, StrokeStyle } from './types';

/**
 * Transform component for entity positioning
 */
export interface Transform {
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Text component containing text content and styling properties
 */
export interface TextComponent {
  readonly type: 'TextComponent';
  text: string;
  fontId: string;
  color: [number, number, number, number];
  maxWidth?: number;
  horizontalAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  characterSpacing?: number;
  wordWrap: boolean;
  dropShadow?: DropShadowStyle;
  stroke?: StrokeStyle;
  visible: boolean;
}

/**
 * Text layout component for caching layout calculations
 */
export interface TextLayoutComponent {
  readonly type: 'TextLayoutComponent';
  layout: LayoutResult | null;
  dirty: boolean;
}

/**
 * Transform component definition for ECS
 */
export const TransformComponent: ComponentDefinition<Transform> = {
  name: 'Transform',
  defaults: () => ({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }),
};

/**
 * Text component definition for ECS
 */
export const TextComponentDef: ComponentDefinition<TextComponent> = {
  name: 'TextComponent',
  defaults: () => ({
    type: 'TextComponent' as const,
    text: '',
    fontId: '',
    color: [1, 1, 1, 1] as [number, number, number, number],
    horizontalAlign: 'left' as const,
    verticalAlign: 'top' as const,
    wordWrap: false,
    visible: true,
  }),
};

/**
 * Text layout component definition for ECS
 */
export const TextLayoutComponentDef: ComponentDefinition<TextLayoutComponent> = {
  name: 'TextLayoutComponent',
  defaults: () => ({
    type: 'TextLayoutComponent' as const,
    layout: null,
    dirty: true,
  }),
};
