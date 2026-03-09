import { TextComponent, TextLayoutComponent } from './components';
import { DropShadowStyle, StrokeStyle } from './types';

/**
 * Serializable representation of TextComponent
 */
export interface SerializedTextComponent {
  type: 'TextComponent';
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
 * Serializable representation of TextLayoutComponent
 */
export interface SerializedTextLayoutComponent {
  type: 'TextLayoutComponent';
  // Layout is not serialized as it's computed data that should be recalculated
  dirty: boolean;
}

/**
 * Options for text component serialization
 */
export interface TextSerializationOptions {
  /** Whether to include font validation during deserialization */
  validateFonts?: boolean;
  /** Fallback font ID to use when referenced font is missing */
  fallbackFontId?: string;
}

/**
 * Serializes a TextComponent to a plain object
 */
export function serializeTextComponent(component: TextComponent): SerializedTextComponent {
  return {
    type: component.type,
    text: component.text,
    fontId: component.fontId,
    color: [...component.color] as [number, number, number, number],
    maxWidth: component.maxWidth,
    horizontalAlign: component.horizontalAlign,
    verticalAlign: component.verticalAlign,
    lineHeight: component.lineHeight,
    characterSpacing: component.characterSpacing,
    wordWrap: component.wordWrap,
    dropShadow: component.dropShadow ? { ...component.dropShadow } : undefined,
    stroke: component.stroke ? { ...component.stroke } : undefined,
    visible: component.visible,
  };
}

/**
 * Deserializes a TextComponent from a plain object
 */
export function deserializeTextComponent(
  data: SerializedTextComponent,
  options: TextSerializationOptions = {}
): TextComponent {
  // Validate required fields
  if (typeof data.text !== 'string') {
    throw new Error('Invalid TextComponent: text must be a string');
  }
  if (typeof data.fontId !== 'string') {
    throw new Error('Invalid TextComponent: fontId must be a string');
  }
  if (!Array.isArray(data.color) || data.color.length !== 4) {
    throw new Error('Invalid TextComponent: color must be a 4-element array');
  }

  // Use fallback font if specified and original font is empty
  const fontId = data.fontId || options.fallbackFontId || '';

  return {
    type: 'TextComponent',
    text: data.text,
    fontId,
    color: [...data.color] as [number, number, number, number],
    maxWidth: data.maxWidth,
    horizontalAlign: data.horizontalAlign || 'left',
    verticalAlign: data.verticalAlign || 'top',
    lineHeight: data.lineHeight,
    characterSpacing: data.characterSpacing,
    wordWrap: data.wordWrap ?? false,
    dropShadow: data.dropShadow || undefined,
    stroke: data.stroke || undefined,
    visible: data.visible ?? true,
  };
}

/**
 * Serializes a TextLayoutComponent to a plain object
 */
export function serializeTextLayoutComponent(
  component: TextLayoutComponent
): SerializedTextLayoutComponent {
  return {
    type: component.type,
    // Layout is not serialized - it will be recalculated on load
    dirty: true, // Always mark as dirty to force recalculation
  };
}

/**
 * Deserializes a TextLayoutComponent from a plain object
 */
export function deserializeTextLayoutComponent(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: SerializedTextLayoutComponent
): TextLayoutComponent {
  return {
    type: 'TextLayoutComponent',
    layout: null, // Layout will be recalculated
    dirty: true, // Always mark as dirty to force recalculation
  };
}

/**
 * Validates that serialized text component data is well-formed
 */
export function validateSerializedTextComponent(data: unknown): data is SerializedTextComponent {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (obj.type !== 'TextComponent') return false;
  if (typeof obj.text !== 'string') return false;
  if (typeof obj.fontId !== 'string') return false;
  if (!Array.isArray(obj.color) || obj.color.length !== 4) return false;
  if (typeof obj.wordWrap !== 'boolean') return false;
  if (typeof obj.visible !== 'boolean') return false;

  // Check alignment values
  const validHAlign = ['left', 'center', 'right'];
  const validVAlign = ['top', 'middle', 'bottom'];
  if (!validHAlign.includes(obj.horizontalAlign as string)) return false;
  if (!validVAlign.includes(obj.verticalAlign as string)) return false;

  // Check optional numeric fields
  if (obj.maxWidth !== undefined && typeof obj.maxWidth !== 'number') return false;
  if (obj.lineHeight !== undefined && typeof obj.lineHeight !== 'number') return false;
  if (obj.characterSpacing !== undefined && typeof obj.characterSpacing !== 'number') return false;

  return true;
}

/**
 * Validates that serialized text layout component data is well-formed
 */
export function validateSerializedTextLayoutComponent(
  data: unknown
): data is SerializedTextLayoutComponent {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (obj.type !== 'TextLayoutComponent') return false;
  if (typeof obj.dirty !== 'boolean') return false;

  return true;
}

/**
 * Error thrown when text component deserialization fails
 */
export class TextDeserializationError extends Error {
  constructor(
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'TextDeserializationError';
  }
}

/**
 * Safely deserializes text component data with error handling
 */
export function safeDeserializeTextComponent(
  data: unknown,
  options: TextSerializationOptions = {}
): TextComponent | null {
  try {
    if (!validateSerializedTextComponent(data)) {
      return null;
    }
    return deserializeTextComponent(data, options);
  } catch (error) {
    console.warn('Failed to deserialize TextComponent:', error);
    return null;
  }
}

/**
 * Safely deserializes text layout component data with error handling
 */
export function safeDeserializeTextLayoutComponent(data: unknown): TextLayoutComponent | null {
  try {
    if (!validateSerializedTextLayoutComponent(data)) {
      return null;
    }
    return deserializeTextLayoutComponent(data);
  } catch (error) {
    console.warn('Failed to deserialize TextLayoutComponent:', error);
    return null;
  }
}

/**
 * Font reference resolver for handling missing fonts during deserialization
 */
export interface FontResolver {
  /** Check if a font exists */
  hasFont(fontId: string): boolean;
  /** Get a fallback font ID when the requested font is missing */
  getFallbackFont(): string | null;
  /** List all available font IDs */
  getAvailableFonts(): string[];
}

/**
 * Enhanced deserialization options with font resolution
 */
export interface EnhancedTextSerializationOptions extends TextSerializationOptions {
  /** Font resolver for handling missing font references */
  fontResolver?: FontResolver;
  /** Whether to throw errors on corruption or return null */
  strictMode?: boolean;
}

/**
 * Deserializes text component with enhanced error handling and font resolution
 */
export function deserializeTextComponentWithFallback(
  data: unknown,
  options: EnhancedTextSerializationOptions = {}
): TextComponent | null {
  try {
    // Validate data structure
    if (!validateSerializedTextComponent(data)) {
      if (options.strictMode) {
        throw new TextDeserializationError('Invalid TextComponent data structure', data);
      }
      return null;
    }

    const serialized = data as SerializedTextComponent;

    // Handle font resolution
    let fontId = serialized.fontId.trim(); // Normalize whitespace
    if (options.fontResolver) {
      if (!fontId || !options.fontResolver.hasFont(fontId)) {
        const fallback = options.fontResolver.getFallbackFont();
        if (fallback) {
          console.warn(`Font '${fontId}' not found, using fallback '${fallback}'`);
          fontId = fallback;
        } else {
          console.warn(`Font '${fontId}' not found and no fallback available`);
          if (options.strictMode) {
            throw new TextDeserializationError(`Font '${fontId}' not found`, data);
          }
          // Use empty string as last resort
          fontId = '';
        }
      }
    }

    // Create component with resolved font
    const modifiedSerialized = { ...serialized, fontId };
    const component = deserializeTextComponent(modifiedSerialized, options);

    return component;
  } catch (error) {
    if (options.strictMode) {
      throw error;
    }
    console.warn('Failed to deserialize TextComponent with fallback:', error);
    return null;
  }
}

/**
 * Detects and repairs common corruption patterns in text component data
 */
export function repairCorruptedTextComponent(data: unknown): SerializedTextComponent | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const obj = data as Record<string, unknown>;
  const repaired: Partial<SerializedTextComponent> = {};

  // Repair type field
  repaired.type = 'TextComponent';

  // Repair text field
  if (typeof obj.text === 'string') {
    repaired.text = obj.text;
  } else if (obj.text === null || obj.text === undefined) {
    repaired.text = '';
  } else {
    repaired.text = String(obj.text);
  }

  // Repair fontId field
  if (typeof obj.fontId === 'string') {
    repaired.fontId = obj.fontId;
  } else {
    repaired.fontId = '';
  }

  // Repair color field
  if (Array.isArray(obj.color) && obj.color.length === 4) {
    const color = obj.color.map((c) => (typeof c === 'number' ? c : 1));
    repaired.color = color as [number, number, number, number];
  } else {
    repaired.color = [1, 1, 1, 1];
  }

  // Repair alignment fields
  const validHAlign = ['left', 'center', 'right'];
  const validVAlign = ['top', 'middle', 'bottom'];
  repaired.horizontalAlign = validHAlign.includes(obj.horizontalAlign as string)
    ? (obj.horizontalAlign as 'left' | 'center' | 'right')
    : 'left';
  repaired.verticalAlign = validVAlign.includes(obj.verticalAlign as string)
    ? (obj.verticalAlign as 'top' | 'middle' | 'bottom')
    : 'top';

  // Repair boolean fields
  repaired.wordWrap = typeof obj.wordWrap === 'boolean' ? obj.wordWrap : false;
  repaired.visible = typeof obj.visible === 'boolean' ? obj.visible : true;

  // Repair optional numeric fields
  if (typeof obj.maxWidth === 'number' && obj.maxWidth > 0) {
    repaired.maxWidth = obj.maxWidth;
  }
  if (typeof obj.lineHeight === 'number' && obj.lineHeight > 0) {
    repaired.lineHeight = obj.lineHeight;
  }
  if (typeof obj.characterSpacing === 'number') {
    repaired.characterSpacing = obj.characterSpacing;
  }

  // Repair style objects
  if (obj.dropShadow && typeof obj.dropShadow === 'object') {
    const shadow = obj.dropShadow as Record<string, unknown>;
    if (
      Array.isArray(shadow.color) &&
      shadow.color.length === 4 &&
      typeof shadow.offsetX === 'number' &&
      typeof shadow.offsetY === 'number'
    ) {
      repaired.dropShadow = {
        color: shadow.color as [number, number, number, number],
        offsetX: shadow.offsetX,
        offsetY: shadow.offsetY,
      };
    }
  }

  if (obj.stroke && typeof obj.stroke === 'object') {
    const stroke = obj.stroke as Record<string, unknown>;
    if (
      Array.isArray(stroke.color) &&
      stroke.color.length === 4 &&
      typeof stroke.width === 'number' &&
      stroke.width > 0
    ) {
      repaired.stroke = {
        color: stroke.color as [number, number, number, number],
        width: stroke.width,
      };
    }
  }

  return repaired as SerializedTextComponent;
}

/**
 * Attempts to deserialize with automatic corruption repair
 */
export function deserializeTextComponentWithRepair(
  data: unknown,
  options: EnhancedTextSerializationOptions = {}
): TextComponent | null {
  // First try normal deserialization
  const normal = deserializeTextComponentWithFallback(data, options);
  if (normal) {
    return normal;
  }

  // If that fails, try repairing the data
  console.warn('Attempting to repair corrupted TextComponent data');
  const repaired = repairCorruptedTextComponent(data);
  if (!repaired) {
    console.error('Could not repair corrupted TextComponent data');
    return null;
  }

  // Try deserializing the repaired data
  return deserializeTextComponentWithFallback(repaired, options);
}
