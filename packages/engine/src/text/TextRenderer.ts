import { World } from '../ecs/World';
import { Entity } from '../ecs/types';
import { Renderer } from '../rendering/Renderer';
import { BitmapFont, TextEntityOptions, TextStyle, TextBounds, MeasureOptions } from './types';
import {
  TransformComponent,
  TextComponentDef,
  TextLayoutComponentDef,
  TextComponent,
  TextLayoutComponent,
} from './components';
import { TextLayoutEngine } from './TextLayoutEngine';
import { FontManager } from './FontManager';
import { TextRenderingSystem } from './TextRenderingSystem';

/**
 * Text renderer interface for creating and managing text entities
 */
export interface TextRenderer {
  /**
   * Create a new text entity with the specified options
   */
  createTextEntity(world: World, options: TextEntityOptions): Entity;

  /**
   * Update the text content of an existing text entity
   */
  updateText(world: World, entity: Entity, text: string): void;

  /**
   * Update the styling of an existing text entity
   */
  updateStyle(world: World, entity: Entity, style: Partial<TextStyle>): void;

  /**
   * Measure text dimensions with the given font and options
   */
  measureText(font: BitmapFont, text: string, options?: MeasureOptions): TextBounds;

  /**
   * Render all text entities in the world
   */
  render(world: World, renderer: Renderer): void;

  /**
   * Set the visibility of a text entity
   */
  setTextVisibility(world: World, entity: Entity, visible: boolean): void;

  /**
   * Get the current bounds of a text entity
   */
  getTextBounds(world: World, entity: Entity): TextBounds | null;

  /**
   * Force bounds recalculation for a text entity
   */
  updateTextBounds(world: World, entity: Entity): void;
}

/**
 * Default implementation of the text renderer
 */
export class DefaultTextRenderer implements TextRenderer {
  private layoutEngine: TextLayoutEngine;
  private fontManager: FontManager;
  private renderingSystem: TextRenderingSystem;

  constructor(layoutEngine: TextLayoutEngine, fontManager: FontManager) {
    this.layoutEngine = layoutEngine;
    this.fontManager = fontManager; // Used for future font management operations
    this.renderingSystem = new TextRenderingSystem(layoutEngine, fontManager);
  }

  createTextEntity(world: World, options: TextEntityOptions): Entity {
    // Validate input options
    const validatedOptions = this.validateTextEntityOptions(options);

    const entity = world.createEntity();

    // Add transform component for positioning
    world.addComponent(entity, TransformComponent, {
      x: validatedOptions.x,
      y: validatedOptions.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    });

    // Create text component with styling
    const textComponent: TextComponent = {
      type: 'TextComponent',
      text: validatedOptions.text,
      fontId: validatedOptions.font,
      color: validatedOptions.style?.color || [1, 1, 1, 1],
      maxWidth: validatedOptions.style?.maxWidth,
      horizontalAlign: validatedOptions.style?.horizontalAlign || 'left',
      verticalAlign: validatedOptions.style?.verticalAlign || 'top',
      lineHeight: validatedOptions.style?.lineHeight,
      characterSpacing: validatedOptions.style?.characterSpacing,
      wordWrap: validatedOptions.style?.wordWrap || false,
      dropShadow: validatedOptions.style?.dropShadow,
      stroke: validatedOptions.style?.stroke,
      visible: true,
    };

    world.addComponent(entity, TextComponentDef, textComponent);

    // Add layout component for caching
    world.addComponent(entity, TextLayoutComponentDef, {
      type: 'TextLayoutComponent',
      layout: null,
      dirty: true,
    });

    return entity;
  }

  updateText(world: World, entity: Entity, text: string): void {
    const textComponent = world.getComponent(entity, TextComponentDef);
    const layoutComponent = world.getComponent(entity, TextLayoutComponentDef);

    if (textComponent && layoutComponent) {
      // Only mark dirty if text actually changed
      if (textComponent.text !== text) {
        textComponent.text = text;
        this.invalidateLayout(layoutComponent);
        // Note: Bounds will be recalculated on next access via getTextBounds()
      }
    }
  }

  updateStyle(world: World, entity: Entity, style: Partial<TextStyle>): void {
    const textComponent = world.getComponent(entity, TextComponentDef);
    const layoutComponent = world.getComponent(entity, TextLayoutComponentDef);

    if (textComponent && layoutComponent) {
      let layoutAffected = false;

      // Update style properties and track if layout is affected
      if (style.color !== undefined) textComponent.color = style.color;

      if (style.maxWidth !== undefined && textComponent.maxWidth !== style.maxWidth) {
        textComponent.maxWidth = style.maxWidth;
        layoutAffected = true;
      }

      if (
        style.horizontalAlign !== undefined &&
        textComponent.horizontalAlign !== style.horizontalAlign
      ) {
        textComponent.horizontalAlign = style.horizontalAlign;
        layoutAffected = true;
      }

      if (
        style.verticalAlign !== undefined &&
        textComponent.verticalAlign !== style.verticalAlign
      ) {
        textComponent.verticalAlign = style.verticalAlign;
        layoutAffected = true;
      }

      if (style.lineHeight !== undefined && textComponent.lineHeight !== style.lineHeight) {
        textComponent.lineHeight = style.lineHeight;
        layoutAffected = true;
      }

      if (
        style.characterSpacing !== undefined &&
        textComponent.characterSpacing !== style.characterSpacing
      ) {
        textComponent.characterSpacing = style.characterSpacing;
        layoutAffected = true;
      }

      if (style.wordWrap !== undefined && textComponent.wordWrap !== style.wordWrap) {
        textComponent.wordWrap = style.wordWrap;
        layoutAffected = true;
      }

      if (style.dropShadow !== undefined) textComponent.dropShadow = style.dropShadow;
      if (style.stroke !== undefined) textComponent.stroke = style.stroke;

      // Only invalidate layout if layout-affecting properties actually changed
      if (layoutAffected) {
        this.invalidateLayout(layoutComponent);
        // Note: Bounds will be recalculated on next access via getTextBounds()
      }
    }
  }

  measureText(font: BitmapFont, text: string, options?: MeasureOptions): TextBounds {
    const layoutOptions = {
      font,
      text,
      maxWidth: options?.maxWidth,
      horizontalAlign: 'left' as const,
      verticalAlign: 'top' as const,
      lineHeight: options?.lineHeight,
      characterSpacing: options?.characterSpacing,
      wordWrap: options?.wordWrap || false,
    };

    const result = this.layoutEngine.calculateLayout(layoutOptions);
    return result.bounds;
  }

  render(world: World, renderer: Renderer): void {
    // Delegate to the text rendering system for efficient batched rendering
    this.renderingSystem.render(world, renderer);
  }

  setTextVisibility(world: World, entity: Entity, visible: boolean): void {
    const textComponent = world.getComponent(entity, TextComponentDef);
    if (textComponent) {
      textComponent.visible = visible;
    }
  }

  getTextBounds(world: World, entity: Entity): TextBounds | null {
    const textComponent = world.getComponent(entity, TextComponentDef);
    const layoutComponent = world.getComponent(entity, TextLayoutComponentDef);

    if (!textComponent || !layoutComponent) {
      return null;
    }

    // Handle empty text as special case
    if (!textComponent.text || textComponent.text.trim().length === 0) {
      // Ensure layout component is updated for empty text
      if (layoutComponent.dirty || !layoutComponent.layout) {
        layoutComponent.layout = {
          characters: [],
          bounds: { x: 0, y: 0, width: 0, height: 0 },
          lineCount: 0,
        };
        layoutComponent.dirty = false;
      }
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // If layout is dirty, missing, or doesn't match current text, recalculate it
    const needsRecalculation =
      layoutComponent.dirty ||
      !layoutComponent.layout ||
      (layoutComponent.layout.characters.length === 0 && textComponent.text.length > 0);

    if (needsRecalculation) {
      this.updateTextBounds(world, entity);
    }

    // Return cached bounds if available
    return layoutComponent.layout ? layoutComponent.layout.bounds : null;
  }

  updateTextBounds(world: World, entity: Entity): void {
    const textComponent = world.getComponent(entity, TextComponentDef);
    const layoutComponent = world.getComponent(entity, TextLayoutComponentDef);

    if (!textComponent || !layoutComponent) {
      return;
    }

    // Get the font for layout calculation
    const font = this.fontManager.getFont(textComponent.fontId);
    if (!font) {
      // If font is not available, set empty bounds
      layoutComponent.layout = {
        characters: [],
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        lineCount: 0,
      };
      layoutComponent.dirty = false;
      return;
    }

    // Handle empty text case
    if (!textComponent.text || textComponent.text.trim().length === 0) {
      layoutComponent.layout = {
        characters: [],
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        lineCount: 0,
      };
      layoutComponent.dirty = false;
      return;
    }

    // Recalculate layout with current text and styling
    const layoutOptions = {
      font,
      text: textComponent.text,
      maxWidth: textComponent.maxWidth,
      horizontalAlign: textComponent.horizontalAlign,
      verticalAlign: textComponent.verticalAlign,
      lineHeight: textComponent.lineHeight,
      characterSpacing: textComponent.characterSpacing,
      wordWrap: textComponent.wordWrap,
    };

    layoutComponent.layout = this.layoutEngine.calculateLayout(layoutOptions);
    layoutComponent.dirty = false;
  }

  /**
   * Invalidate layout for a text entity, marking it for recalculation
   */
  private invalidateLayout(layoutComponent: TextLayoutComponent): void {
    layoutComponent.dirty = true;
    // Clear cached layout to force recalculation
    layoutComponent.layout = null;
  }

  /**
   * Force layout recalculation for all text entities in the world
   * Useful when global font settings change
   */
  invalidateAllLayouts(world: World): void {
    const query = world.query({
      all: [TextLayoutComponentDef],
    });

    for (const row of query) {
      const layoutComponent = row.TextLayoutComponent as TextLayoutComponent;
      this.invalidateLayout(layoutComponent);
    }
  }

  /**
   * Check if a text entity needs layout recalculation
   */
  isLayoutDirty(world: World, entity: Entity): boolean {
    const layoutComponent = world.getComponent(entity, TextLayoutComponentDef);
    return layoutComponent ? layoutComponent.dirty : false;
  }

  /**
   * Check if text bounds are up-to-date for an entity
   */
  areBoundsUpToDate(world: World, entity: Entity): boolean {
    const layoutComponent = world.getComponent(entity, TextLayoutComponentDef);
    return layoutComponent ? !layoutComponent.dirty && layoutComponent.layout !== null : false;
  }

  /**
   * Get the number of text entities that need layout recalculation
   */
  getDirtyLayoutCount(world: World): number {
    const query = world.query({
      all: [TextLayoutComponentDef],
    });

    let count = 0;
    for (const row of query) {
      const layoutComponent = row.TextLayoutComponent as TextLayoutComponent;
      if (layoutComponent.dirty) {
        count++;
      }
    }
    return count;
  }

  /**
   * Validate and sanitize text entity options
   */
  private validateTextEntityOptions(options: TextEntityOptions): TextEntityOptions {
    const validated = { ...options };

    // Ensure text is not null/undefined
    if (validated.text === null || validated.text === undefined) {
      validated.text = '';
    }

    // Ensure font ID is provided
    if (!validated.font || validated.font.trim().length === 0) {
      throw new Error('Font ID is required for text entity creation');
    }

    // Validate position values
    validated.x = isFinite(validated.x) ? validated.x : 0;
    validated.y = isFinite(validated.y) ? validated.y : 0;

    // Validate style options if provided
    if (validated.style) {
      validated.style = this.validateTextStyle(validated.style);
    }

    return validated;
  }

  /**
   * Validate and sanitize text style options
   */
  private validateTextStyle(style: Partial<TextStyle>): Partial<TextStyle> {
    const validated = { ...style };

    // Validate color array
    if (validated.color) {
      if (!Array.isArray(validated.color) || validated.color.length !== 4) {
        validated.color = [1, 1, 1, 1];
      } else {
        validated.color = validated.color.map((c) => Math.max(0, Math.min(1, c))) as [
          number,
          number,
          number,
          number,
        ];
      }
    }

    // Validate maxWidth
    if (validated.maxWidth !== undefined) {
      validated.maxWidth = Math.max(0, validated.maxWidth);
    }

    // Validate line height
    if (validated.lineHeight !== undefined) {
      validated.lineHeight = Math.max(1, validated.lineHeight);
    }

    // Validate character spacing
    if (validated.characterSpacing !== undefined) {
      validated.characterSpacing = Math.max(-50, Math.min(100, validated.characterSpacing));
    }

    // Validate alignment values
    const validHorizontalAlign = ['left', 'center', 'right'];
    const validVerticalAlign = ['top', 'middle', 'bottom'];

    if (validated.horizontalAlign && !validHorizontalAlign.includes(validated.horizontalAlign)) {
      validated.horizontalAlign = 'left';
    }

    if (validated.verticalAlign && !validVerticalAlign.includes(validated.verticalAlign)) {
      validated.verticalAlign = 'top';
    }

    return validated;
  }

  /**
   * Handle text entity errors gracefully
   */
  handleTextEntityError(world: World, entity: Entity, error: Error): void {
    console.warn(`Text entity error for entity ${entity}:`, error.message);

    // Try to recover by setting safe defaults
    const textComponent = world.getComponent(entity, TextComponentDef);
    const layoutComponent = world.getComponent(entity, TextLayoutComponentDef);

    if (textComponent && layoutComponent) {
      // Set safe text content
      if (!textComponent.text || textComponent.text.trim().length === 0) {
        textComponent.text = '';
      }

      // Mark for recalculation with safe parameters
      this.invalidateLayout(layoutComponent);
    }
  }
}

/**
 * Utility functions for text measurement and bounds calculation
 */
export class TextUtils {
  private layoutEngine: TextLayoutEngine;

  constructor(layoutEngine: TextLayoutEngine) {
    this.layoutEngine = layoutEngine;
  }

  /**
   * Calculate text bounds for the given text and font
   */
  calculateTextBounds(font: BitmapFont, text: string, options?: MeasureOptions): TextBounds {
    const layoutOptions = {
      font,
      text,
      maxWidth: options?.maxWidth,
      horizontalAlign: 'left' as const,
      verticalAlign: 'top' as const,
      lineHeight: options?.lineHeight,
      characterSpacing: options?.characterSpacing,
      wordWrap: options?.wordWrap || false,
    };

    const result = this.layoutEngine.calculateLayout(layoutOptions);
    return result.bounds;
  }

  /**
   * Get text width for the given text and font
   */
  getTextWidth(font: BitmapFont, text: string, options?: MeasureOptions): number {
    const bounds = this.calculateTextBounds(font, text, options);
    return bounds.width;
  }

  /**
   * Get text height for the given text and font
   */
  getTextHeight(font: BitmapFont, text: string, options?: MeasureOptions): number {
    const bounds = this.calculateTextBounds(font, text, options);
    return bounds.height;
  }

  /**
   * Check if text content is empty (null, undefined, or whitespace only)
   */
  isEmptyText(text: string | null | undefined): boolean {
    return !text || text.trim().length === 0;
  }

  /**
   * Get bounds for empty text (returns zero dimensions)
   */
  getEmptyTextBounds(): TextBounds {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}
