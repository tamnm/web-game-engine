/**
 * Text rendering demo showcasing comprehensive bitmap font rendering capabilities.
 * Demonstrates font loading, text layout, styling effects, and interactive controls.
 */

import { BaseDemo } from './BaseDemo.js';
import {
  World,
  Renderer,
  DefaultTextRenderer,
  TextLayoutEngine,
  FontManager,
  createBitmapFont,
  parseBMFontText,
  DevOverlay,
} from '@web-game-engine/core';
import type { Texture, BitmapFont } from '@web-game-engine/core';
import { AssetManager } from '@web-game-engine/core';

/**
 * TextRenderingDemo showcases the engine's text rendering capabilities.
 *
 * Features demonstrated:
 * - BMFont format loading and parsing
 * - Text layout with wrapping and alignment
 * - Styling effects (color, drop shadow, stroke outline)
 * - Interactive property controls
 * - Multiple font support
 * - Performance with many text entities
 */
export class TextRenderingDemo extends BaseDemo {
  private textRenderer!: DefaultTextRenderer;
  private fontManager!: FontManager;
  private layoutEngine!: TextLayoutEngine;
  private devOverlay!: DevOverlay;
  private controlPanel!: HTMLDivElement;
  private textEntities: number[] = [];
  private currentFont = 'demo-font-1';

  // Demo fonts data
  private fonts: Map<string, BitmapFont> = new Map();

  async init(): Promise<void> {
    // Set canvas size
    this.canvas.width = 1200;
    this.canvas.height = 800;

    // Create ECS world
    this.world = new World() as unknown;

    // Create text rendering components
    this.layoutEngine = new TextLayoutEngine();
    const mockAssetManager = {} as AssetManager;
    this.fontManager = new FontManager(mockAssetManager);
    this.textRenderer = new DefaultTextRenderer(this.layoutEngine, this.fontManager);

    // Create sample fonts
    this.createSampleFonts();

    // Create renderer
    this.renderer = new Renderer({
      contextProvider: () => this.canvas.getContext('2d'),
    }) as unknown;

    // Enable dev tools overlay
    this.devOverlay = new DevOverlay({
      position: 'top-left',
    });
    this.devOverlay.attach();

    // Create interactive control panel
    this.createControlPanel();

    // Create initial text examples
    this.createTextExamples();

    this.renderScene();
  }

  /**
   * Create sample bitmap fonts for demonstration
   */
  private createSampleFonts(): void {
    // Create Font 1 - Basic font with simple characters
    const font1Size = 16;
    const font1Data = this.generateBMFontData('Demo Font 1', font1Size);
    const font1Texture = this.createFontTexture(font1Data, font1Size, '#4a9eff');
    const font1 = createBitmapFont('demo-font-1', font1Data, font1Texture);
    this.fonts.set('demo-font-1', font1);

    // Create Font 2 - Larger font with different style
    const font2Size = 24;
    const font2Data = this.generateBMFontData('Demo Font 2', font2Size);
    const font2Texture = this.createFontTexture(font2Data, font2Size, '#50c878');
    const font2 = createBitmapFont('demo-font-2', font2Data, font2Texture);
    this.fonts.set('demo-font-2', font2);

    // Mock font manager to return our fonts
    this.fontManager.getFont = (id: string) => {
      return this.fonts.get(id);
    };
  }

  /**
   * Generate BMFont format data for a sample font
   */
  private generateBMFontData(faceName: string, size: number) {
    // Include all common characters including lowercase, uppercase, numbers, and punctuation
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-()[]{}:;\'"/\\@#$%^&*+=<>|`~_';
    const charData: Array<{
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
      xoffset: number;
      yoffset: number;
      xadvance: number;
    }> = [];

    let x = 0;
    let y = 0;
    // Use consistent sizing - character width should match the actual rendered size
    const charWidth = size; // Use full size for proper spacing
    const charHeight = size;
    const charsPerRow = 16;

    // Calculate proper baseline - typically 80% of font size from top
    const baseline = Math.floor(size * 0.8);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      charData.push({
        id: char.charCodeAt(0),
        x: x * charWidth,
        y: y * charHeight,
        width: charWidth,
        height: charHeight,
        xoffset: 0,
        yoffset: 0, // Keep yoffset 0 for simplicity, baseline handled in font metrics
        xadvance: charWidth,
      });

      x++;
      if (x >= charsPerRow) {
        x = 0;
        y++;
      }
    }

    // Use proper font metrics with adequate line height for multi-line text
    const lineHeight = Math.floor(size * 1.2); // 20% larger than font size for proper line spacing

    const bmfontText = `info face="${faceName}" size=${size}
common lineHeight=${lineHeight} base=${baseline} scaleW=${charsPerRow * charWidth} scaleH=${(y + 1) * charHeight}
page id=0 file="font.png"
chars count=${charData.length}
${charData
  .map(
    (char) =>
      `char id=${char.id} x=${char.x} y=${char.y} width=${char.width} height=${char.height} xoffset=${char.xoffset} yoffset=${char.yoffset} xadvance=${char.xadvance}`
  )
  .join('\n')}`;

    return parseBMFontText(bmfontText);
  }

  /**
   * Create a texture atlas for the font
   */
  private createFontTexture(
    fontData: {
      common: { scaleW: number; scaleH: number };
      chars: Array<{ id: number; x: number; y: number; width: number; height: number }>;
    },
    fontSize: number,
    backgroundColor: string
  ): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = fontData.common.scaleW;
    canvas.height = fontData.common.scaleH;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw white glyphs on a transparent atlas so tinting controls the final color.
    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Draw all characters, ensuring they fit within their allocated space
    for (const char of fontData.chars) {
      const character = String.fromCharCode(char.id);

      // Center the glyph within its cell for better appearance.
      const centerX = char.x + (char.width - fontSize * 0.6) / 2;
      const centerY = char.y;

      ctx.fillText(character, centerX, centerY);
    }

    return {
      id: `font-texture-${backgroundColor}-${fontSize}`,
      width: canvas.width,
      height: canvas.height,
      source: canvas,
    };
  }

  /**
   * Create interactive control panel for text properties
   */
  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      max-height: 700px;
      overflow-y: auto;
    `;

    this.controlPanel.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #4a9eff;">Text Rendering Controls</h3>
      
      <div style="margin-bottom: 15px;">
        <label>Font:</label><br>
        <select id="font-select" style="width: 100%; margin-top: 5px;">
          <option value="demo-font-1">Demo Font 1 (16px)</option>
          <option value="demo-font-2">Demo Font 2 (24px)</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <label>Text Content:</label><br>
        <textarea id="text-content" style="width: 100%; height: 60px; margin-top: 5px;">Hello World!
This is a multi-line text example.
It demonstrates wrapping and alignment.</textarea>
      </div>

      <div style="margin-bottom: 15px;">
        <label>Max Width: <span id="width-value">300</span>px</label><br>
        <input type="range" id="max-width" min="100" max="600" value="300" style="width: 100%;">
      </div>

      <div style="margin-bottom: 15px;">
        <label>Horizontal Alignment:</label><br>
        <select id="h-align" style="width: 100%; margin-top: 5px;">
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <label>Vertical Alignment:</label><br>
        <select id="v-align" style="width: 100%; margin-top: 5px;">
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <label>Character Spacing: <span id="char-spacing-value">0</span>px</label><br>
        <input type="range" id="char-spacing" min="-5" max="20" value="0" style="width: 100%;">
      </div>

      <div style="margin-bottom: 15px;">
        <label>Line Height: <span id="line-height-value">1.2</span></label><br>
        <input type="range" id="line-height" min="0.8" max="3.0" step="0.1" value="1.2" style="width: 100%;">
      </div>

      <div style="margin-bottom: 15px;">
        <label>
          <input type="checkbox" id="word-wrap" checked> Word Wrap
        </label>
      </div>

      <div style="margin-bottom: 15px;">
        <label>Text Color:</label><br>
        <input type="color" id="text-color" value="#ffffff" style="width: 100%; margin-top: 5px;">
      </div>

      <div style="margin-bottom: 15px;">
        <label>
          <input type="checkbox" id="drop-shadow"> Drop Shadow
        </label>
        <div id="shadow-controls" style="margin-left: 20px; margin-top: 5px; display: none;">
          <label>Shadow Color:</label><br>
          <input type="color" id="shadow-color" value="#000000" style="width: 100%; margin-bottom: 5px;">
          <label>Offset X: <span id="shadow-x-value">2</span>px</label><br>
          <input type="range" id="shadow-x" min="-10" max="10" value="2" style="width: 100%; margin-bottom: 5px;">
          <label>Offset Y: <span id="shadow-y-value">2</span>px</label><br>
          <input type="range" id="shadow-y" min="-10" max="10" value="2" style="width: 100%;">
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <label>
          <input type="checkbox" id="stroke-outline"> Stroke Outline
        </label>
        <div style="font-size: 10px; color: #ff6b6b; margin-top: 2px;">⚠️ PERFORMANCE WARNING: Renders 9x per character!</div>
        <div id="stroke-controls" style="margin-left: 20px; margin-top: 5px; display: none;">
          <label>Stroke Color:</label><br>
          <input type="color" id="stroke-color" value="#000000" style="width: 100%; margin-bottom: 5px;">
          <label>Stroke Width: <span id="stroke-width-value">1</span>px</label><br>
          <input type="range" id="stroke-width" min="1" max="5" value="1" style="width: 100%;">
        </div>
      </div>

      <button id="add-text" style="width: 100%; padding: 8px; margin-top: 10px; background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Add Text Entity
      </button>

      <button id="clear-all" style="width: 100%; padding: 8px; margin-top: 5px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Clear All Text
      </button>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
        <div>Text Entities: <span id="entity-count">0</span></div>
        <div style="font-size: 10px; color: #888; margin: 5px 0;">💡 Tip: Avoid stroke effects for better performance</div>
        <div>Performance Test:</div>
        <button id="stress-test" style="width: 100%; padding: 8px; margin-top: 5px; background: #ffd93d; color: black; border: none; border-radius: 4px; cursor: pointer;">
          Create 50 Random Texts
        </button>
      </div>
    `;

    document.body.appendChild(this.controlPanel);
    this.setupControlEventListeners();
  }

  /**
   * Set up event listeners for control panel
   */
  private setupControlEventListeners(): void {
    // Range input updates
    const updateRangeValue = (id: string, valueId: string, suffix = '') => {
      const input = document.getElementById(id) as HTMLInputElement;
      const valueSpan = document.getElementById(valueId) as HTMLSpanElement;
      input.addEventListener('input', () => {
        valueSpan.textContent = input.value + suffix;
      });
    };

    updateRangeValue('max-width', 'width-value', 'px');
    updateRangeValue('char-spacing', 'char-spacing-value', 'px');
    updateRangeValue('line-height', 'line-height-value');
    updateRangeValue('shadow-x', 'shadow-x-value', 'px');
    updateRangeValue('shadow-y', 'shadow-y-value', 'px');
    updateRangeValue('stroke-width', 'stroke-width-value', 'px');

    // Checkbox toggles
    const dropShadowCheck = document.getElementById('drop-shadow') as HTMLInputElement;
    const shadowControls = document.getElementById('shadow-controls') as HTMLDivElement;
    dropShadowCheck.addEventListener('change', () => {
      shadowControls.style.display = dropShadowCheck.checked ? 'block' : 'none';
    });

    const strokeCheck = document.getElementById('stroke-outline') as HTMLInputElement;
    const strokeControls = document.getElementById('stroke-controls') as HTMLDivElement;
    strokeCheck.addEventListener('change', () => {
      strokeControls.style.display = strokeCheck.checked ? 'block' : 'none';
    });

    // Button actions
    document.getElementById('add-text')?.addEventListener('click', () => {
      this.addTextEntity();
    });

    document.getElementById('clear-all')?.addEventListener('click', () => {
      this.clearAllText();
    });

    document.getElementById('stress-test')?.addEventListener('click', () => {
      this.createStressTest();
    });

    // Font selection
    document.getElementById('font-select')?.addEventListener('change', (e) => {
      this.currentFont = (e.target as HTMLSelectElement).value;
    });
  }

  /**
   * Create initial text examples showcasing different features
   */
  private createTextExamples(): void {
    const world = this.world as World;

    // Create a multi-line text example to test line spacing
    const entity1 = this.textRenderer.createTextEntity(world, {
      text: 'Hello World!\nThis is line 2\nAnd line 3',
      font: 'demo-font-1',
      x: 50,
      y: 50,
      style: {
        color: [1, 1, 1, 1],
        maxWidth: 300,
        wordWrap: true,
      },
    });
    this.textEntities.push(entity1);

    // Create a wrapped text example
    const entity2 = this.textRenderer.createTextEntity(world, {
      text: 'This is a longer text that should wrap to multiple lines when the width is constrained.',
      font: 'demo-font-2',
      x: 400,
      y: 50,
      style: {
        color: [0.8, 1, 0.8, 1],
        maxWidth: 250,
        wordWrap: true,
        horizontalAlign: 'center',
      },
    });
    this.textEntities.push(entity2);

    this.updateEntityCount();
  }

  /**
   * Add a new text entity based on current control panel settings
   */
  private addTextEntity(): void {
    const world = this.world as World;

    // Get control values
    const textContent = (document.getElementById('text-content') as HTMLTextAreaElement).value;
    const maxWidth = parseInt((document.getElementById('max-width') as HTMLInputElement).value);
    const hAlign = (document.getElementById('h-align') as HTMLSelectElement).value as
      | 'left'
      | 'center'
      | 'right';
    const vAlign = (document.getElementById('v-align') as HTMLSelectElement).value as
      | 'top'
      | 'middle'
      | 'bottom';
    const charSpacing = parseInt(
      (document.getElementById('char-spacing') as HTMLInputElement).value
    );
    const lineHeightMultiplier = parseFloat(
      (document.getElementById('line-height') as HTMLInputElement).value
    );

    // Calculate actual line height based on font's base line height
    const font = this.fonts.get(this.currentFont);
    const lineHeight = font ? Math.floor(font.lineHeight * lineHeightMultiplier) : undefined;
    const wordWrap = (document.getElementById('word-wrap') as HTMLInputElement).checked;

    // Color conversion
    const textColorHex = (document.getElementById('text-color') as HTMLInputElement).value;
    const textColor = this.hexToRgba(textColorHex);

    // Shadow settings
    const dropShadow = (document.getElementById('drop-shadow') as HTMLInputElement).checked;
    let shadowStyle = undefined;
    if (dropShadow) {
      const shadowColorHex = (document.getElementById('shadow-color') as HTMLInputElement).value;
      const shadowColor = this.hexToRgba(shadowColorHex);
      const shadowX = parseInt((document.getElementById('shadow-x') as HTMLInputElement).value);
      const shadowY = parseInt((document.getElementById('shadow-y') as HTMLInputElement).value);
      shadowStyle = {
        color: shadowColor,
        offsetX: shadowX,
        offsetY: shadowY,
      };
    }

    // Stroke settings
    const strokeOutline = (document.getElementById('stroke-outline') as HTMLInputElement).checked;
    let strokeStyle = undefined;
    if (strokeOutline) {
      const strokeColorHex = (document.getElementById('stroke-color') as HTMLInputElement).value;
      const strokeColor = this.hexToRgba(strokeColorHex);
      const strokeWidth = parseInt(
        (document.getElementById('stroke-width') as HTMLInputElement).value
      );
      strokeStyle = {
        color: strokeColor,
        width: strokeWidth,
      };
    }

    // Random position for new entities
    const x = Math.random() * (this.canvas.width - maxWidth);
    const y = Math.random() * (this.canvas.height - 200) + 100;

    const entity = this.textRenderer.createTextEntity(world, {
      text: textContent,
      font: this.currentFont,
      x,
      y,
      style: {
        color: textColor,
        maxWidth,
        horizontalAlign: hAlign,
        verticalAlign: vAlign,
        characterSpacing: charSpacing,
        lineHeight,
        wordWrap,
        dropShadow: shadowStyle,
        stroke: strokeStyle,
      },
    });

    this.textEntities.push(entity);
    this.updateEntityCount();
    this.renderScene();
  }

  /**
   * Clear all text entities
   */
  private clearAllText(): void {
    const world = this.world as World;

    for (const entity of this.textEntities) {
      world.destroyEntity(entity);
    }

    this.textEntities = [];
    this.updateEntityCount();
    this.renderScene();
  }

  /**
   * Create stress test with many text entities
   */
  private createStressTest(): void {
    const world = this.world as World;
    const sampleTexts = [
      'Performance Test',
      'Many Text Entities',
      'Batching Demo',
      'Stress Test',
      'Text Rendering',
      'Engine Demo',
    ];

    for (let i = 0; i < 50; i++) {
      const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      const font = Math.random() > 0.5 ? 'demo-font-1' : 'demo-font-2';
      const x = Math.random() * (this.canvas.width - 200);
      const y = Math.random() * (this.canvas.height - 100) + 50;

      const entity = this.textRenderer.createTextEntity(world, {
        text,
        font,
        x,
        y,
        style: {
          color: [Math.random(), Math.random(), Math.random(), 1],
          // Avoid stroke effects in stress test for better performance
        },
      });

      this.textEntities.push(entity);
    }

    this.updateEntityCount();
    this.renderScene();
  }

  /**
   * Update entity count display
   */
  private updateEntityCount(): void {
    const countSpan = document.getElementById('entity-count');
    if (countSpan) {
      countSpan.textContent = this.textEntities.length.toString();
    }
  }

  /**
   * Convert hex color to RGBA array
   */
  private hexToRgba(hex: string): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
  }

  /**
   * Override update to prevent unnecessary world stepping
   */
  override update(delta: number): void {
    // Text rendering demo doesn't need world stepping
    // All text entities are static and managed manually
    // This prevents unnecessary ECS system processing

    // Suppress unused parameter warning
    void delta;
  }

  /**
   * Override render to use the text rendering system
   */
  override render(): void {
    this.renderScene();
  }

  private renderScene(): void {
    const renderer = this.renderer as Renderer;
    const world = this.world as World;

    // Clear canvas first
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Begin rendering frame
    renderer.begin();

    // Render all text entities
    this.textRenderer.render(world, renderer);

    // End rendering frame and get stats
    const stats = renderer.end();

    // Update dev overlay with render stats
    if (this.devOverlay) {
      this.devOverlay.update(stats);
    }
  }

  /**
   * Override cleanup to remove control panel
   */
  override cleanup(): void {
    // Remove control panel
    if (this.controlPanel && this.controlPanel.parentNode) {
      this.controlPanel.parentNode.removeChild(this.controlPanel);
    }

    // Detach dev overlay
    if (this.devOverlay) {
      this.devOverlay.detach();
    }

    // Call base cleanup
    super.cleanup();
  }
}
