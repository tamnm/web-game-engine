import { World } from '../ecs/World';
import { Entity } from '../ecs/types';
import { Renderer } from '../rendering/Renderer';
import { SpriteDrawOptions, TextureRegion } from '../rendering/types';
import { BitmapFont, LayoutResult, CharacterLayout, CharacterData } from './types';
import {
  TransformComponent,
  TextComponentDef,
  TextLayoutComponentDef,
  Transform,
  TextComponent,
  TextLayoutComponent,
} from './components';
import { TextLayoutEngine } from './TextLayoutEngine';
import { FontManager } from './FontManager';

/**
 * Text rendering system that processes text entities and renders them as sprites
 */
export class TextRenderingSystem {
  private layoutEngine: TextLayoutEngine;
  private fontManager: FontManager;

  constructor(layoutEngine: TextLayoutEngine, fontManager: FontManager) {
    this.layoutEngine = layoutEngine;
    this.fontManager = fontManager;
  }

  /**
   * Render all text entities in the world
   */
  render(world: World, renderer: Renderer): void {
    // Get all entities with text components
    type TextEntityRow = {
      entity: Entity;
      Transform: Transform;
      TextComponent: TextComponent;
      TextLayoutComponent: TextLayoutComponent;
    };

    const query = world.query<TextEntityRow>({
      all: [TransformComponent, TextComponentDef, TextLayoutComponentDef],
    });

    // Group entities by font for batching optimization
    const fontBatches = new Map<string, TextEntityRow[]>();

    for (const row of query) {
      const textComponent = row.TextComponent;

      // Skip invisible text entities
      if (!textComponent.visible) {
        continue;
      }

      // Refresh dirty layouts before using bounds for culling.
      const font = this.fontManager.getFont(textComponent.fontId);
      if (!font) {
        continue;
      }
      if (row.TextLayoutComponent.dirty || !row.TextLayoutComponent.layout) {
        this.recalculateLayout(textComponent, row.TextLayoutComponent, font);
      }

      // Group by font for batching
      if (!fontBatches.has(textComponent.fontId)) {
        fontBatches.set(textComponent.fontId, []);
      }
      fontBatches.get(textComponent.fontId)!.push(row);
    }

    // Render each font batch
    for (const [fontId, entities] of fontBatches) {
      const font = this.fontManager.getFont(fontId);
      if (!font) {
        continue;
      }

      this.renderFontBatch(entities, font, renderer);
    }
  }

  /**
   * Render a batch of text entities using the same font
   */
  private renderFontBatch(
    entities: Array<{
      entity: Entity;
      Transform: Transform;
      TextComponent: TextComponent;
      TextLayoutComponent: TextLayoutComponent;
    }>,
    font: BitmapFont,
    renderer: Renderer
  ): void {
    // Layouts are refreshed before culling in render(); render only current layouts here.
    for (const entity of entities) {
      const transform = entity.Transform;
      const textComponent = entity.TextComponent;
      const layoutComponent = entity.TextLayoutComponent;

      // Render text layout if available
      if (layoutComponent.layout) {
        this.renderTextLayout(renderer, transform, textComponent, layoutComponent.layout, font);
      }
    }
  }

  /**
   * Recalculate layout for a single text entity
   */
  private recalculateLayout(
    textComponent: TextComponent,
    layoutComponent: TextLayoutComponent,
    font: BitmapFont
  ): void {
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
   * Render individual text layout as sprites
   */
  private renderTextLayout(
    renderer: Renderer,
    transform: Transform,
    textComponent: TextComponent,
    layout: LayoutResult,
    font: BitmapFont
  ): void {
    // Render styling effects in correct order: shadow, stroke, main text

    // 1. Render drop shadow if enabled
    if (textComponent.dropShadow) {
      this.renderTextWithOffset(
        renderer,
        transform,
        layout,
        font,
        textComponent.dropShadow.offsetX,
        textComponent.dropShadow.offsetY,
        textComponent.dropShadow.color
      );
    }

    // 2. Render stroke outline if enabled
    if (textComponent.stroke) {
      this.renderStrokeOutline(renderer, transform, textComponent, layout, font);
    }

    // 3. Render main text
    this.renderTextWithOffset(renderer, transform, layout, font, 0, 0, textComponent.color);
  }

  /**
   * Render text with a specific offset and color (used for shadows and main text)
   */
  private renderTextWithOffset(
    renderer: Renderer,
    transform: Transform,
    layout: LayoutResult,
    font: BitmapFont,
    offsetX: number,
    offsetY: number,
    color: [number, number, number, number]
  ): void {
    for (const charLayout of layout.characters) {
      const characterData = font.characters.get(charLayout.char);
      if (!characterData) {
        continue; // Skip unsupported characters
      }

      // Convert character layout to sprite draw options
      const spriteOptions = this.characterToSpriteOptions(
        charLayout,
        characterData,
        transform,
        offsetX,
        offsetY,
        color
      );

      // Create texture region for the character from font atlas
      const textureRegion = this.createCharacterTextureRegion(characterData, font);

      // Render the character sprite
      renderer.drawSprite(textureRegion, spriteOptions);
    }
  }

  /**
   * Render stroke outline by rendering text multiple times with offsets
   */
  private renderStrokeOutline(
    renderer: Renderer,
    transform: Transform,
    textComponent: TextComponent,
    layout: LayoutResult,
    font: BitmapFont
  ): void {
    if (!textComponent.stroke) return;

    const strokeWidth = textComponent.stroke.width;
    const strokeColor = textComponent.stroke.color;

    // Render outline by drawing text at multiple offset positions
    // Use 8-direction offsets for a complete outline
    const offsets = [
      [-strokeWidth, -strokeWidth], // Top-left
      [0, -strokeWidth], // Top
      [strokeWidth, -strokeWidth], // Top-right
      [strokeWidth, 0], // Right
      [strokeWidth, strokeWidth], // Bottom-right
      [0, strokeWidth], // Bottom
      [-strokeWidth, strokeWidth], // Bottom-left
      [-strokeWidth, 0], // Left
    ];

    for (const [offsetX, offsetY] of offsets) {
      this.renderTextWithOffset(renderer, transform, layout, font, offsetX, offsetY, strokeColor);
    }
  }

  /**
   * Convert character layout data to sprite draw options
   */
  private characterToSpriteOptions(
    charLayout: CharacterLayout,
    characterData: CharacterData,
    transform: Transform,
    offsetX: number,
    offsetY: number,
    color: [number, number, number, number]
  ): SpriteDrawOptions {
    // CharacterLayout already includes glyph offsets from the layout phase.
    const worldX = transform.x + charLayout.x + offsetX;
    const worldY = transform.y + charLayout.y + offsetY;

    return {
      x: worldX,
      y: worldY,
      width: characterData.width,
      height: characterData.height,
      rotation: transform.rotation || 0,
      tint: color,
      origin: [0, 0], // Character positioning is already calculated, use top-left origin
      parallax: [1, 1], // Text renders in world space by default
    };
  }

  /**
   * Create a TextureRegion for a character from the font atlas
   */
  private createCharacterTextureRegion(
    characterData: CharacterData,
    font: BitmapFont
  ): TextureRegion {
    return {
      texture: font.atlas,
      x: characterData.x,
      y: characterData.y,
      width: characterData.width,
      height: characterData.height,
      origin: [0, 0], // Use top-left origin for character regions
    };
  }
}
