import { World } from '../ecs/World';
import { Entity } from '../ecs/types';
import {
  TextComponent,
  TextLayoutComponent,
  TextComponentDef,
  TextLayoutComponentDef,
} from './components';
import {
  SerializedTextComponent,
  SerializedTextLayoutComponent,
  FontResolver,
  EnhancedTextSerializationOptions,
  deserializeTextComponentWithFallback,
  deserializeTextLayoutComponent,
  serializeTextComponent,
  serializeTextLayoutComponent,
  deserializeTextComponentWithRepair,
} from './serialization';
import { FontManager } from './FontManager';

/**
 * Serialized representation of all text entities in a world
 */
export interface SerializedTextWorld {
  version: number;
  entities: Array<{
    entity: Entity;
    textComponent?: SerializedTextComponent;
    textLayoutComponent?: SerializedTextLayoutComponent;
  }>;
}

/**
 * Options for text world serialization
 */
export interface TextWorldSerializationOptions {
  /** Whether to include layout components (usually not needed) */
  includeLayout?: boolean;
  /** Font resolver for handling missing fonts */
  fontResolver?: FontResolver;
  /** Whether to use strict mode for deserialization */
  strictMode?: boolean;
  /** Whether to attempt repair of corrupted data */
  attemptRepair?: boolean;
}

/**
 * Manager for serializing and deserializing text entities
 */
export class TextSerializationManager {
  private static readonly CURRENT_VERSION = 1;

  constructor(private fontManager?: FontManager) {}

  /**
   * Creates a font resolver using the font manager
   */
  private createFontResolver(): FontResolver | undefined {
    if (!this.fontManager) return undefined;

    return {
      hasFont: (fontId: string) => this.fontManager!.getFont(fontId) !== undefined,
      getFallbackFont: () => {
        // Try to find any available font as fallback
        const fonts = this.fontManager!.getAvailableFonts();
        return fonts.length > 0 ? fonts[0] : null;
      },
      getAvailableFonts: () => this.fontManager!.getAvailableFonts(),
    };
  }

  /**
   * Serializes all text entities from a world
   */
  serializeTextWorld(
    world: World,
    options: TextWorldSerializationOptions = {}
  ): SerializedTextWorld {
    const query = world.query({
      any: [TextComponentDef, TextLayoutComponentDef],
    });

    const entities: SerializedTextWorld['entities'] = [];

    for (const result of query) {
      const entity = result.entity as Entity;
      const textComponent = world.getComponent(entity, TextComponentDef);
      const textLayoutComponent = world.getComponent(entity, TextLayoutComponentDef);

      if (!textComponent && !textLayoutComponent) continue;

      const serializedEntity: SerializedTextWorld['entities'][0] = { entity };

      if (textComponent) {
        serializedEntity.textComponent = serializeTextComponent(textComponent);
      }

      if (textLayoutComponent && options.includeLayout) {
        serializedEntity.textLayoutComponent = serializeTextLayoutComponent(textLayoutComponent);
      }

      entities.push(serializedEntity);
    }

    return {
      version: TextSerializationManager.CURRENT_VERSION,
      entities,
    };
  }

  /**
   * Deserializes text entities into a world
   */
  deserializeTextWorld(
    world: World,
    data: SerializedTextWorld,
    options: TextWorldSerializationOptions = {}
  ): { success: number; failed: number; repaired: number } {
    const stats = { success: 0, failed: 0, repaired: 0 };

    // Handle version compatibility
    if (data.version !== TextSerializationManager.CURRENT_VERSION) {
      console.warn(
        `Text serialization version mismatch: expected ${TextSerializationManager.CURRENT_VERSION}, got ${data.version}`
      );
    }

    const fontResolver = options.fontResolver || this.createFontResolver();
    const deserializationOptions: EnhancedTextSerializationOptions = {
      fontResolver,
      strictMode: options.strictMode,
    };

    for (const entityData of data.entities) {
      try {
        const entity = entityData.entity;

        // For deserialization, we'll create a new entity and map it
        // In a real implementation, you might want to preserve entity IDs
        let targetEntity = entity;
        if (!world.hasEntity(entity)) {
          targetEntity = world.createEntity();
        }

        // Deserialize text component
        if (entityData.textComponent) {
          let textComponent: TextComponent | null = null;

          if (options.attemptRepair) {
            textComponent = deserializeTextComponentWithRepair(
              entityData.textComponent,
              deserializationOptions
            );
            if (textComponent) {
              stats.repaired++;
            }
          } else {
            textComponent = deserializeTextComponentWithFallback(
              entityData.textComponent,
              deserializationOptions
            );
          }

          if (textComponent) {
            world.upsertComponent(targetEntity, TextComponentDef, textComponent);
            stats.success++;
          } else {
            console.error(`Failed to deserialize TextComponent for entity ${entity}`);
            stats.failed++;
            continue;
          }
        }

        // Deserialize layout component
        if (entityData.textLayoutComponent) {
          const layoutComponent = deserializeTextLayoutComponent(entityData.textLayoutComponent);
          if (layoutComponent) {
            world.upsertComponent(targetEntity, TextLayoutComponentDef, layoutComponent);
          }
        } else if (entityData.textComponent) {
          // Create a dirty layout component for text entities
          const layoutComponent: TextLayoutComponent = {
            type: 'TextLayoutComponent',
            layout: null,
            dirty: true,
          };
          world.upsertComponent(targetEntity, TextLayoutComponentDef, layoutComponent);
        }
      } catch (error) {
        console.error(`Failed to deserialize text entity ${entityData.entity}:`, error);
        stats.failed++;
      }
    }

    return stats;
  }

  /**
   * Validates serialized text world data
   */
  validateSerializedTextWorld(data: unknown): data is SerializedTextWorld {
    if (typeof data !== 'object' || data === null) return false;

    const obj = data as Record<string, unknown>;

    if (typeof obj.version !== 'number') return false;
    if (!Array.isArray(obj.entities)) return false;

    for (const entity of obj.entities) {
      if (typeof entity !== 'object' || entity === null) return false;
      if (typeof (entity as Record<string, unknown>).entity !== 'number') return false;
    }

    return true;
  }

  /**
   * Creates a migration function for upgrading old text serialization formats
   */
  createMigration(
    fromVersion: number,
    toVersion: number
  ): (data: unknown) => SerializedTextWorld | null {
    return (data: unknown) => {
      if (!this.validateSerializedTextWorld(data)) {
        return null;
      }

      const serialized = data as SerializedTextWorld;

      // For now, we only have version 1, so no migrations needed
      if (fromVersion === 1 && toVersion === 1) {
        return serialized;
      }

      console.warn(`No migration available from version ${fromVersion} to ${toVersion}`);
      return null;
    };
  }
}
