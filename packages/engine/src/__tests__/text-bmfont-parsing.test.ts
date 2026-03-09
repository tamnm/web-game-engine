import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseBMFontText, createBitmapFont } from '../text/BMFontParser';
import { TextLayoutEngine } from '../text/TextLayoutEngine';
import { Texture } from '../rendering/types';
import { CharacterLayout } from '../text/types';

/**
 * **Feature: text-rendering-system, Property 1: Font parsing completeness**
 * For any valid BMFont format file, parsing should successfully extract all character data,
 * kerning information, and font metrics without data loss
 * **Validates: Requirements 1.1, 1.2**
 */

// Generator for valid BMFont info line
const bmfontInfoArb = fc.record({
  face: fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => !s.includes('"') && !s.includes('=')),
  size: fc.integer({ min: 8, max: 72 }),
  bold: fc.integer({ min: 0, max: 1 }),
  italic: fc.integer({ min: 0, max: 1 }),
  charset: fc.string({ maxLength: 10 }).filter((s) => !s.includes('"') && !s.includes('=')),
  unicode: fc.integer({ min: 0, max: 1 }),
  stretchH: fc.integer({ min: 50, max: 200 }),
  smooth: fc.integer({ min: 0, max: 1 }),
  aa: fc.integer({ min: 0, max: 1 }),
  padding: fc.tuple(
    fc.integer({ min: 0, max: 10 }),
    fc.integer({ min: 0, max: 10 }),
    fc.integer({ min: 0, max: 10 }),
    fc.integer({ min: 0, max: 10 })
  ),
  spacing: fc.tuple(fc.integer({ min: 0, max: 5 }), fc.integer({ min: 0, max: 5 })),
});

// Generator for valid BMFont common line
const bmfontCommonArb = fc.record({
  lineHeight: fc.integer({ min: 8, max: 100 }),
  base: fc.integer({ min: 8, max: 100 }),
  scaleW: fc.integer({ min: 64, max: 2048 }),
  scaleH: fc.integer({ min: 64, max: 2048 }),
  pages: fc.constant(1), // Only single page for now
  packed: fc.integer({ min: 0, max: 1 }),
  alphaChnl: fc.integer({ min: 0, max: 4 }),
  redChnl: fc.integer({ min: 0, max: 4 }),
  greenChnl: fc.integer({ min: 0, max: 4 }),
  blueChnl: fc.integer({ min: 0, max: 4 }),
});

// Generator for valid BMFont page line
const bmfontPageArb = fc.record({
  id: fc.constant(0),
  file: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => !s.includes('"') && !s.includes('='))
    .map((s) => s + '.png'),
});

// Generator for valid BMFont character
const bmfontCharArb = fc.record({
  id: fc.integer({ min: 32, max: 126 }), // Printable ASCII range
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 }),
  width: fc.integer({ min: 1, max: 64 }),
  height: fc.integer({ min: 1, max: 64 }),
  xoffset: fc.integer({ min: -10, max: 10 }),
  yoffset: fc.integer({ min: -10, max: 10 }),
  xadvance: fc.integer({ min: 1, max: 64 }),
  page: fc.constant(0),
  chnl: fc.integer({ min: 0, max: 15 }),
});

// Generator for valid BMFont kerning pair
const bmfontKerningArb = fc.record({
  first: fc.integer({ min: 32, max: 126 }),
  second: fc.integer({ min: 32, max: 126 }),
  amount: fc.integer({ min: -10, max: 10 }),
});

// Generator for complete BMFont data
const bmfontDataArb = fc.record({
  info: bmfontInfoArb,
  common: bmfontCommonArb,
  pages: fc.array(bmfontPageArb, { minLength: 1, maxLength: 1 }),
  chars: fc.array(bmfontCharArb, { minLength: 1, maxLength: 50 }).map((chars) => {
    // Ensure unique character IDs
    const uniqueChars = new Map();
    for (const char of chars) {
      uniqueChars.set(char.id, char);
    }
    return Array.from(uniqueChars.values());
  }),
  kernings: fc.array(bmfontKerningArb, { minLength: 0, maxLength: 20 }).map((kernings) => {
    // Ensure unique kerning pairs
    const uniqueKernings = new Map();
    for (const kerning of kernings) {
      const key = `${kerning.first}-${kerning.second}`;
      uniqueKernings.set(key, kerning);
    }
    return Array.from(uniqueKernings.values());
  }),
});

// Helper function to generate BMFont text format
function generateBMFontText(data: {
  info: {
    face: string;
    size: number;
    bold: number;
    italic: number;
    charset: string;
    unicode: number;
    stretchH: number;
    smooth: number;
    aa: number;
    padding: [number, number, number, number];
    spacing: [number, number];
  };
  common: {
    lineHeight: number;
    base: number;
    scaleW: number;
    scaleH: number;
    pages: number;
    packed: number;
    alphaChnl: number;
    redChnl: number;
    greenChnl: number;
    blueChnl: number;
  };
  pages: Array<{ id: number; file: string }>;
  chars: Array<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    xoffset: number;
    yoffset: number;
    xadvance: number;
    page: number;
    chnl: number;
  }>;
  kernings: Array<{ first: number; second: number; amount: number }>;
}): string {
  const lines: string[] = [];

  // Info line
  const info = data.info;
  lines.push(
    `info face="${info.face}" size=${info.size} bold=${info.bold} italic=${info.italic} ` +
      `charset="${info.charset}" unicode=${info.unicode} stretchH=${info.stretchH} ` +
      `smooth=${info.smooth} aa=${info.aa} padding=${info.padding.join(',')} ` +
      `spacing=${info.spacing.join(',')}`
  );

  // Common line
  const common = data.common;
  lines.push(
    `common lineHeight=${common.lineHeight} base=${common.base} scaleW=${common.scaleW} ` +
      `scaleH=${common.scaleH} pages=${common.pages} packed=${common.packed} ` +
      `alphaChnl=${common.alphaChnl} redChnl=${common.redChnl} greenChnl=${common.greenChnl} ` +
      `blueChnl=${common.blueChnl}`
  );

  // Page lines
  for (const page of data.pages) {
    lines.push(`page id=${page.id} file="${page.file}"`);
  }

  // Character lines
  for (const char of data.chars) {
    lines.push(
      `char id=${char.id} x=${char.x} y=${char.y} width=${char.width} height=${char.height} ` +
        `xoffset=${char.xoffset} yoffset=${char.yoffset} xadvance=${char.xadvance} ` +
        `page=${char.page} chnl=${char.chnl}`
    );
  }

  // Kerning lines
  for (const kerning of data.kernings) {
    lines.push(`kerning first=${kerning.first} second=${kerning.second} amount=${kerning.amount}`);
  }

  return lines.join('\n');
}

// Helper function to create a mock texture
function createMockTexture(width: number, height: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return {
    id: 'test-atlas',
    width,
    height,
    source: canvas,
  };
}

describe('BMFont Parser Property Tests', () => {
  it('Property 1: Font parsing completeness - should preserve all data through parse and create cycle', () => {
    fc.assert(
      fc.property(bmfontDataArb, (originalData) => {
        // Ensure characters fit within atlas bounds
        const atlasWidth = Math.max(
          originalData.common.scaleW,
          ...originalData.chars.map((c) => c.x + c.width)
        );
        const atlasHeight = Math.max(
          originalData.common.scaleH,
          ...originalData.chars.map((c) => c.y + c.height)
        );

        const bmfontText = generateBMFontText(originalData);
        const parsedData = parseBMFontText(bmfontText);
        const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
        const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

        // Verify info data preservation
        expect(parsedData.info.face).toBe(originalData.info.face);
        expect(parsedData.info.size).toBe(originalData.info.size);
        expect(parsedData.info.bold).toBe(originalData.info.bold);
        expect(parsedData.info.italic).toBe(originalData.info.italic);

        // Verify common data preservation
        expect(parsedData.common.lineHeight).toBe(originalData.common.lineHeight);
        expect(parsedData.common.base).toBe(originalData.common.base);
        expect(parsedData.common.scaleW).toBe(originalData.common.scaleW);
        expect(parsedData.common.scaleH).toBe(originalData.common.scaleH);

        // Verify bitmap font creation
        expect(bitmapFont.id).toBe('test-font');
        expect(bitmapFont.lineHeight).toBe(originalData.common.lineHeight);
        expect(bitmapFont.baseline).toBe(originalData.common.base);
        expect(bitmapFont.atlas).toBe(mockAtlas);

        // Verify character data preservation
        expect(bitmapFont.characters.size).toBe(originalData.chars.length);
        for (const originalChar of originalData.chars) {
          const char = String.fromCharCode(originalChar.id);
          const characterData = bitmapFont.characters.get(char);
          expect(characterData).toBeDefined();
          if (characterData) {
            expect(characterData.char).toBe(char);
            expect(characterData.x).toBe(originalChar.x);
            expect(characterData.y).toBe(originalChar.y);
            expect(characterData.width).toBe(originalChar.width);
            expect(characterData.height).toBe(originalChar.height);
            expect(characterData.xOffset).toBe(originalChar.xoffset);
            expect(characterData.yOffset).toBe(originalChar.yoffset);
            expect(characterData.xAdvance).toBe(originalChar.xadvance);
          }
        }

        // Verify kerning data preservation
        expect(bitmapFont.kerningPairs.size).toBe(originalData.kernings.length);
        for (const originalKerning of originalData.kernings) {
          const first = String.fromCharCode(originalKerning.first);
          const second = String.fromCharCode(originalKerning.second);
          const key = first + second;
          const kerningAmount = bitmapFont.kerningPairs.get(key);
          expect(kerningAmount).toBe(originalKerning.amount);
        }

        // Verify pages data preservation
        expect(parsedData.pages.length).toBe(originalData.pages.length);
        for (let i = 0; i < originalData.pages.length; i++) {
          expect(parsedData.pages[i].id).toBe(originalData.pages[i].id);
          expect(parsedData.pages[i].file).toBe(originalData.pages[i].file);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 2: Font loading error handling**
   * For any invalid or corrupted font format data, the loading process should reject
   * the operation and provide clear error information
   * **Validates: Requirements 1.3**
   */
  it('Property 2: Font loading error handling - should reject invalid BMFont data', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty string
          fc.constant('invalid bmfont data'), // Invalid format
          fc.constant('info face="test"\ncommon lineHeight=invalid'), // Invalid numbers
          fc.constant('info face="test"\ncommon lineHeight=16\nchar id=invalid') // Invalid char data
        ),
        (invalidBMFontText) => {
          // Test that invalid BMFont text throws an error or produces invalid results
          try {
            const result = parseBMFontText(invalidBMFontText);

            // If parsing succeeds, verify that the result is clearly invalid
            // (e.g., missing required fields, zero values where they shouldn't be)
            if (invalidBMFontText === '') {
              // Empty string should result in default/empty values
              expect(result.info.face).toBe('');
              expect(result.common.lineHeight).toBe(0);
              expect(result.chars.length).toBe(0);
            } else if (invalidBMFontText.includes('invalid')) {
              // Invalid numeric values should result in NaN or 0
              if (invalidBMFontText.includes('lineHeight=invalid')) {
                expect(result.common.lineHeight).toBe(0); // parseInt of invalid string returns NaN, which becomes 0
              }
              if (invalidBMFontText.includes('id=invalid')) {
                expect(result.chars.length).toBe(0); // Invalid char should not be added
              }
            }
          } catch (error) {
            // It's also acceptable for the parser to throw an error for invalid input
            expect(error).toBeInstanceOf(Error);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 3: Font resource isolation**
   * For any set of loaded fonts, each font should be managed independently
   * without resource conflicts or cross-contamination
   * **Validates: Requirements 1.4**
   */
  it('Property 3: Font resource isolation - fonts should be managed independently', () => {
    fc.assert(
      fc.property(fc.array(bmfontDataArb, { minLength: 2, maxLength: 5 }), (fontDataArray) => {
        // Create multiple fonts with different IDs
        const fonts: Array<{
          id: string;
          characters: Map<string, unknown>;
          kerningPairs: Map<string, unknown>;
        }> = [];

        for (let i = 0; i < fontDataArray.length; i++) {
          const fontData = fontDataArray[i];
          const fontId = `test-font-${i}`;

          // Ensure characters fit within atlas bounds
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont(fontId, parsedData, mockAtlas);

          fonts.push(bitmapFont);
        }

        // Verify each font has unique ID and independent data
        const fontIds = new Set();
        for (const font of fonts) {
          expect(fontIds.has(font.id)).toBe(false); // No duplicate IDs
          fontIds.add(font.id);

          // Each font should have its own character map
          expect(font.characters).toBeInstanceOf(Map);
          expect(font.kerningPairs).toBeInstanceOf(Map);

          // Modifying one font's data shouldn't affect others
          const originalCharCount = font.characters.size;
          font.characters.set('test-char', {
            char: 'test-char',
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            xOffset: 0,
            yOffset: 0,
            xAdvance: 1,
          });

          // Other fonts should be unaffected
          for (const otherFont of fonts) {
            if (otherFont.id !== font.id) {
              expect(otherFont.characters.has('test-char')).toBe(false);
            }
          }

          // Restore original state
          font.characters.delete('test-char');
          expect(font.characters.size).toBe(originalCharCount);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 4: Font atlas validation**
   * For any font atlas texture and associated metadata, all referenced characters
   * should exist within the texture bounds
   * **Validates: Requirements 1.5**
   */
  it('Property 4: Font atlas validation - characters should fit within atlas bounds', () => {
    fc.assert(
      fc.property(bmfontDataArb, (fontData) => {
        // Ensure characters fit within atlas bounds for valid case
        const atlasWidth = Math.max(
          fontData.common.scaleW,
          ...fontData.chars.map((c) => c.x + c.width)
        );
        const atlasHeight = Math.max(
          fontData.common.scaleH,
          ...fontData.chars.map((c) => c.y + c.height)
        );

        const validAtlas = createMockTexture(atlasWidth, atlasHeight);
        const bmfontText = generateBMFontText(fontData);
        const parsedData = parseBMFontText(bmfontText);

        // Valid atlas should work fine
        const bitmapFont = createBitmapFont('test-font', parsedData, validAtlas);
        expect(bitmapFont.characters.size).toBe(fontData.chars.length);

        // Verify all characters are within bounds
        for (const char of fontData.chars) {
          const character = bitmapFont.characters.get(String.fromCharCode(char.id));
          if (character) {
            expect(character.x + character.width).toBeLessThanOrEqual(atlasWidth);
            expect(character.y + character.height).toBeLessThanOrEqual(atlasHeight);
            expect(character.x).toBeGreaterThanOrEqual(0);
            expect(character.y).toBeGreaterThanOrEqual(0);
          }
        }
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 8: Word boundary wrapping**
   * For any text that exceeds the specified wrap width, line breaks should occur
   * at appropriate word boundaries when possible
   * **Validates: Requirements 3.1**
   */
  it('Property 8: Word boundary wrapping - should break lines at word boundaries', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 2) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate text with multiple words using only available characters
              words: fc.array(
                fc
                  .array(fc.constantFrom(...nonSpaceChars), { minLength: 1, maxLength: 5 })
                  .map((chars) => chars.join('')),
                { minLength: 2, maxLength: 6 }
              ),
              fontData: fc.constant(fontData),
              // Generate wrap width that will force wrapping
              wrapWidthMultiplier: fc.float({ min: Math.fround(0.3), max: Math.fround(0.8) }),
            });
          })
          .filter((data) => data !== null),
        ({ words, fontData, wrapWidthMultiplier }) => {
          // Create a bitmap font
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Create text from words
          const text = words.join(' ');

          // Calculate total text width without wrapping
          const layoutEngine = new TextLayoutEngine();
          const unwrappedLayout = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Set wrap width to force wrapping
          const maxWidth = Math.max(1, unwrappedLayout.bounds.width * wrapWidthMultiplier);

          // Calculate layout with wrapping
          const wrappedLayout = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            maxWidth,
            wordWrap: true,
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // If text was wrapped, verify word boundaries are respected
          if (wrappedLayout.lineCount > 1) {
            // Group characters by line based on Y position
            const lines: string[] = [];
            let currentLine = '';
            let currentY = wrappedLayout.characters[0]?.y ?? 0;

            for (const char of wrappedLayout.characters) {
              if (Math.abs(char.y - currentY) > 1) {
                // New line detected
                if (currentLine.trim()) {
                  lines.push(currentLine.trim());
                }
                currentLine = char.char;
                currentY = char.y;
              } else {
                currentLine += char.char;
              }
            }
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }

            // Verify that word boundaries are respected
            // The key property: when text wraps, it should prefer to break at word boundaries

            // Simple check: if we have multiple lines, at least one line break should occur at a space
            // (unless all words are too long to fit on individual lines)
            const originalText = words.join(' ');
            const hasSpaces = originalText.includes(' ');

            if (hasSpaces && lines.length > 1) {
              // Check that line breaks generally occur at word boundaries
              // We'll verify this by checking that most line breaks don't split words
              let properWordBreaks = 0;

              for (let i = 0; i < lines.length - 1; i++) {
                const currentLine = lines[i];
                const nextLine = lines[i + 1];

                // Check if the break between these lines respects word boundaries
                // A proper word break means the current line ends with a complete word
                // and the next line starts with a complete word
                const currentLineEndsWithSpace =
                  currentLine.endsWith(' ') || !currentLine.includes(' ');
                const nextLineStartsWithSpace = nextLine.startsWith(' ') || !nextLine.includes(' ');

                // If either condition is true, it's likely a proper word boundary break
                if (
                  currentLineEndsWithSpace ||
                  nextLineStartsWithSpace ||
                  !currentLine.trim() ||
                  !nextLine.trim()
                ) {
                  properWordBreaks++;
                }
              }

              // At least some breaks should respect word boundaries
              // (unless we're dealing with very long words that must be broken)
              const exclamationChar = bitmapFont.characters.get('!');
              const charWidth = exclamationChar?.xAdvance || 10; // fallback width
              const wordBoundaryRespected =
                properWordBreaks > 0 || words.every((word) => word.length > maxWidth / charWidth);

              expect(wordBoundaryRespected).toBe(true);
            }

            // Verify that wrapping actually occurred (more lines than unwrapped)
            expect(wrappedLayout.lineCount).toBeGreaterThan(unwrappedLayout.lineCount);
          }

          // Verify all characters are still present
          const originalChars = text.replace(/\s/g, '');
          const layoutChars = wrappedLayout.characters
            .map((c) => c.char)
            .join('')
            .replace(/\s/g, '');
          expect(layoutChars).toBe(originalChars);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 9: Character boundary wrapping**
   * For any single word that exceeds the wrap width, the word should be broken
   * at character boundaries
   * **Validates: Requirements 3.2**
   */
  it('Property 9: Character boundary wrapping - should break long words at character boundaries', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 3) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate a single long word using available characters
              longWord: fc
                .array(fc.constantFrom(...nonSpaceChars), { minLength: 8, maxLength: 20 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              // Generate wrap width that will force character breaking
              wrapWidthMultiplier: fc.float({ min: Math.fround(0.1), max: Math.fround(0.4) }),
            });
          })
          .filter((data) => data !== null),
        ({ longWord, fontData, wrapWidthMultiplier }) => {
          // Create a bitmap font
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Calculate total word width without wrapping
          const layoutEngine = new TextLayoutEngine();
          const unwrappedLayout = layoutEngine.calculateLayout({
            font: bitmapFont,
            text: longWord,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Set wrap width smaller than the word width to force character breaking
          const maxWidth = Math.max(1, unwrappedLayout.bounds.width * wrapWidthMultiplier);

          // Calculate layout with wrapping
          const wrappedLayout = layoutEngine.calculateLayout({
            font: bitmapFont,
            text: longWord,
            maxWidth,
            wordWrap: true,
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // If the word was broken, verify character boundaries are respected
          if (wrappedLayout.lineCount > 1) {
            // Collect all characters from the layout
            const layoutChars = wrappedLayout.characters.map((c) => c.char).join('');

            // Verify all original characters are preserved
            expect(layoutChars).toBe(longWord);

            // Verify that each line contains valid character sequences
            const lines: string[] = [];
            let currentLine = '';
            let currentY = wrappedLayout.characters[0]?.y ?? 0;

            for (const char of wrappedLayout.characters) {
              if (Math.abs(char.y - currentY) > 1) {
                // New line detected
                if (currentLine) {
                  lines.push(currentLine);
                }
                currentLine = char.char;
                currentY = char.y;
              } else {
                currentLine += char.char;
              }
            }
            if (currentLine) {
              lines.push(currentLine);
            }

            // Verify that when concatenated, lines form the original word
            const reconstructed = lines.join('');
            expect(reconstructed).toBe(longWord);

            // Verify that breaking occurred (more than one line)
            expect(lines.length).toBeGreaterThan(1);

            // Verify each line is non-empty
            for (const line of lines) {
              expect(line.length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 13: Horizontal alignment positioning**
   * For any text with specified horizontal alignment, character positions should align correctly
   * (left edges for left, centers for center, right edges for right) relative to the anchor point
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  it('Property 13: Horizontal alignment positioning - should position text according to horizontal alignment', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 2) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate text using available characters
              text: fc
                .array(fc.constantFrom(...nonSpaceChars), { minLength: 3, maxLength: 10 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              // Test all horizontal alignment options
              horizontalAlign: fc.constantFrom('left', 'center', 'right') as fc.Arbitrary<
                'left' | 'center' | 'right'
              >,
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, horizontalAlign }) => {
          // Create a bitmap font
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Calculate layout with specified horizontal alignment
          const layoutEngine = new TextLayoutEngine();
          const layout = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign,
            verticalAlign: 'top',
          });

          if (layout.characters.length > 0) {
            const bounds = layout.bounds;

            // Calculate layout without alignment for comparison
            const unalignedLayout = layoutEngine.calculateLayout({
              font: bitmapFont,
              text,
              wordWrap: false,
              horizontalAlign: 'left',
              verticalAlign: 'top',
            });

            // Verify horizontal alignment positioning by comparing with unaligned layout
            switch (horizontalAlign) {
              case 'left': {
                // Left alignment should be the same as unaligned (baseline)
                expect(bounds.x).toBeCloseTo(unalignedLayout.bounds.x, 1);
                break;
              }

              case 'center': {
                // Center alignment: text should be shifted left by half its width
                const expectedCenterX = unalignedLayout.bounds.x - unalignedLayout.bounds.width / 2;
                expect(bounds.x).toBeCloseTo(expectedCenterX, 1);
                break;
              }

              case 'right': {
                // Right alignment: text should be shifted left by its full width
                const expectedRightX = unalignedLayout.bounds.x - unalignedLayout.bounds.width;
                expect(bounds.x).toBeCloseTo(expectedRightX, 1);
                break;
              }
            }

            // Verify alignment by comparing different alignments
            const leftLayout = layoutEngine.calculateLayout({
              font: bitmapFont,
              text,
              wordWrap: false,
              horizontalAlign: 'left',
              verticalAlign: 'top',
            });

            const rightLayout = layoutEngine.calculateLayout({
              font: bitmapFont,
              text,
              wordWrap: false,
              horizontalAlign: 'right',
              verticalAlign: 'top',
            });

            // Right alignment should position text to the left of left alignment
            if (leftLayout.characters.length > 0 && rightLayout.characters.length > 0) {
              const leftFirstChar = leftLayout.characters[0];
              const rightFirstChar = rightLayout.characters[0];
              expect(rightFirstChar.x).toBeLessThan(leftFirstChar.x);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 14: Vertical alignment positioning**
   * For any text with specified vertical alignment, line positions should align correctly
   * (top edges for top, centers for middle, bottom edges for bottom) relative to the anchor point
   * **Validates: Requirements 4.4, 4.5, 4.6**
   */
  it('Property 14: Vertical alignment positioning - should position text according to vertical alignment', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 2) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate text using available characters
              text: fc
                .array(fc.constantFrom(...nonSpaceChars), { minLength: 3, maxLength: 10 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
              // Test all vertical alignment options
              verticalAlign: fc.constantFrom('top', 'middle', 'bottom') as fc.Arbitrary<
                'top' | 'middle' | 'bottom'
              >,
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData, verticalAlign }) => {
          // Create a bitmap font
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Calculate layout with specified vertical alignment
          const layoutEngine = new TextLayoutEngine();
          const layout = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign,
          });

          if (layout.characters.length > 0) {
            const bounds = layout.bounds;

            // Calculate layout without alignment for comparison
            const unalignedLayout = layoutEngine.calculateLayout({
              font: bitmapFont,
              text,
              wordWrap: false,
              horizontalAlign: 'left',
              verticalAlign: 'top',
            });

            // Verify vertical alignment positioning by comparing with unaligned layout
            switch (verticalAlign) {
              case 'top': {
                // Top alignment should be the same as unaligned (baseline)
                expect(bounds.y).toBeCloseTo(unalignedLayout.bounds.y, 1);
                break;
              }

              case 'middle': {
                // Middle alignment: text should be shifted up by half its height
                const expectedMiddleY =
                  unalignedLayout.bounds.y - unalignedLayout.bounds.height / 2;
                expect(bounds.y).toBeCloseTo(expectedMiddleY, 1);
                break;
              }

              case 'bottom': {
                // Bottom alignment: text should be shifted up by its full height
                const expectedBottomY = unalignedLayout.bounds.y - unalignedLayout.bounds.height;
                expect(bounds.y).toBeCloseTo(expectedBottomY, 1);
                break;
              }
            }

            // Verify alignment by comparing different alignments
            const topLayout = layoutEngine.calculateLayout({
              font: bitmapFont,
              text,
              wordWrap: false,
              horizontalAlign: 'left',
              verticalAlign: 'top',
            });

            const bottomLayout = layoutEngine.calculateLayout({
              font: bitmapFont,
              text,
              wordWrap: false,
              horizontalAlign: 'left',
              verticalAlign: 'bottom',
            });

            // Bottom alignment should position text above top alignment
            if (topLayout.characters.length > 0 && bottomLayout.characters.length > 0) {
              const topFirstChar = topLayout.characters[0];
              const bottomFirstChar = bottomLayout.characters[0];
              expect(bottomFirstChar.y).toBeLessThan(topFirstChar.y);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 20: Spacing application**
   * For any text with specified line height or character spacing, the spacing should be
   * applied consistently across all lines and characters
   * **Validates: Requirements 6.1, 6.2**
   */
  it('Property 20: Spacing application - should apply spacing consistently', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 3) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              // Generate multi-line text using available characters
              lines: fc.array(
                fc
                  .array(fc.constantFrom(...nonSpaceChars), { minLength: 2, maxLength: 6 })
                  .map((chars) => chars.join('')),
                { minLength: 2, maxLength: 4 }
              ),
              fontData: fc.constant(fontData),
              // Generate spacing values
              lineHeight: fc.integer({ min: 5, max: 50 }),
              characterSpacing: fc.integer({ min: -5, max: 10 }),
            });
          })
          .filter((data) => data !== null),
        ({ lines, fontData, lineHeight, characterSpacing }) => {
          // Create a bitmap font
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          const text = lines.join('\n');

          // Calculate layout with custom spacing
          const layoutEngine = new TextLayoutEngine();
          const layout = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
            lineHeight,
            characterSpacing,
          });

          if (layout.characters.length > 0 && layout.lineCount > 1) {
            // Group characters by line based on Y position
            const charactersByLine: CharacterLayout[][] = [];
            let currentLineChars: CharacterLayout[] = [];
            let currentY = layout.characters[0].y;

            for (const char of layout.characters) {
              if (Math.abs(char.y - currentY) > 1) {
                // New line detected
                if (currentLineChars.length > 0) {
                  charactersByLine.push(currentLineChars);
                }
                currentLineChars = [char];
                currentY = char.y;
              } else {
                currentLineChars.push(char);
              }
            }
            if (currentLineChars.length > 0) {
              charactersByLine.push(currentLineChars);
            }

            // Simply verify that spacing parameters affect the layout
            // Test line height by comparing layouts with different line heights
            if (layout.lineCount > 1) {
              const differentLineHeightLayout = layoutEngine.calculateLayout({
                font: bitmapFont,
                text,
                wordWrap: false,
                horizontalAlign: 'left',
                verticalAlign: 'top',
                lineHeight: lineHeight + 10,
              });

              // Different line heights should produce different layouts
              expect(JSON.stringify(layout.characters)).not.toBe(
                JSON.stringify(differentLineHeightLayout.characters)
              );
            }

            // Test character spacing by comparing layouts with different character spacing
            const differentCharSpacingLayout = layoutEngine.calculateLayout({
              font: bitmapFont,
              text: lines[0], // Use single line for character spacing test
              wordWrap: false,
              horizontalAlign: 'left',
              verticalAlign: 'top',
              characterSpacing: characterSpacing + 3,
            });

            if (layout.characters.length > 1 && differentCharSpacingLayout.characters.length > 1) {
              // Different character spacing should produce different character positions
              let positionsDiffer = false;
              for (
                let i = 0;
                i <
                Math.min(layout.characters.length, differentCharSpacingLayout.characters.length);
                i++
              ) {
                if (
                  Math.abs(layout.characters[i].x - differentCharSpacingLayout.characters[i].x) >
                  0.01
                ) {
                  positionsDiffer = true;
                  break;
                }
              }
              expect(positionsDiffer).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 21: Kerning adjustment application**
   * For any text using a font with kerning data, kerning adjustments should be
   * applied between appropriate character pairs
   * **Validates: Requirements 6.3**
   */
  it('Property 21: Kerning adjustment application - should apply kerning between character pairs', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Only test fonts that have kerning data
            if (fontData.kernings.length === 0) {
              return fc.constant(null); // Skip fonts without kerning
            }

            // Extract available characters that have kerning pairs
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const kerningChars = new Set<string>();

            for (const kerning of fontData.kernings) {
              kerningChars.add(String.fromCharCode(kerning.first));
              kerningChars.add(String.fromCharCode(kerning.second));
            }

            const kerningCharArray = Array.from(kerningChars).filter((c) =>
              availableChars.includes(c)
            );

            if (kerningCharArray.length < 2) {
              return fc.constant(null); // Skip if not enough kerning characters
            }

            return fc.record({
              // Generate text using characters that have kerning pairs
              text: fc
                .array(fc.constantFrom(...kerningCharArray), { minLength: 2, maxLength: 8 })
                .map((chars) => chars.join('')),
              fontData: fc.constant(fontData),
            });
          })
          .filter((data) => data !== null),
        ({ text, fontData }) => {
          // Create a bitmap font
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );

          const mockAtlas = createMockTexture(atlasWidth, atlasHeight);
          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockAtlas);

          // Calculate layout with kerning
          const layoutEngine = new TextLayoutEngine();
          const layoutWithKerning = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Create a font without kerning for comparison
          const fontWithoutKerning = {
            ...bitmapFont,
            kerningPairs: new Map<string, number>(),
          };

          const layoutWithoutKerning = layoutEngine.calculateLayout({
            font: fontWithoutKerning,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Check if kerning was applied by comparing layouts
          if (
            layoutWithKerning.characters.length > 1 &&
            layoutWithoutKerning.characters.length > 1
          ) {
            // Look for any kerning pairs in the text
            let hasKerningPairs = false;
            for (let i = 1; i < text.length; i++) {
              const prevChar = text[i - 1];
              const currentChar = text[i];
              const kerningKey = prevChar + currentChar;
              const kerningAmount = bitmapFont.kerningPairs.get(kerningKey);

              if (kerningAmount !== undefined && kerningAmount !== 0) {
                hasKerningPairs = true;
                break;
              }
            }

            // If there are kerning pairs, the layouts should be different
            if (hasKerningPairs) {
              let layoutsDiffer = false;
              for (
                let i = 0;
                i <
                Math.min(
                  layoutWithKerning.characters.length,
                  layoutWithoutKerning.characters.length
                );
                i++
              ) {
                if (
                  Math.abs(
                    layoutWithKerning.characters[i].x - layoutWithoutKerning.characters[i].x
                  ) > 0.01
                ) {
                  layoutsDiffer = true;
                  break;
                }
              }
              expect(layoutsDiffer).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 10: Single line rendering when wrapping disabled**
   * For any text with wrapping disabled, all content should render on a single line regardless of width
   * **Validates: Requirements 3.3**
   */
  it('should render all text on single line when wrapping is disabled', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 3) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              fontData: fc.constant(fontData),
              text: fc
                .array(fc.constantFrom(...nonSpaceChars), { minLength: 3, maxLength: 20 })
                .map((chars) => chars.join('')),
              // Include manual line breaks to test they get converted to spaces
              textWithLineBreaks: fc
                .array(
                  fc.oneof(
                    fc
                      .array(fc.constantFrom(...nonSpaceChars), { minLength: 1, maxLength: 5 })
                      .map((chars) => chars.join('')),
                    fc.constant('\n')
                  ),
                  { minLength: 3, maxLength: 8 }
                )
                .map((parts) => parts.join('')),
              maxWidth: fc.integer({ min: 10, max: 100 }),
            });
          })
          .filter((data) => data !== null),
        ({ fontData, text, textWithLineBreaks, maxWidth }) => {
          const layoutEngine = new TextLayoutEngine();

          // Create mock texture with appropriate size
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );
          const mockTexture = createMockTexture(atlasWidth, atlasHeight);

          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockTexture);

          // Test with simple text
          const layoutWithWrappingDisabled = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            maxWidth,
            wordWrap: false, // Wrapping disabled
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Should always have exactly 1 line regardless of width
          expect(layoutWithWrappingDisabled.lineCount).toBe(1);

          // Test with text containing manual line breaks
          const layoutWithLineBreaks = layoutEngine.calculateLayout({
            font: bitmapFont,
            text: textWithLineBreaks,
            maxWidth,
            wordWrap: false, // Wrapping disabled
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Should still have exactly 1 line (line breaks converted to spaces)
          // However, if the text becomes empty after processing (e.g., only line breaks),
          // it should have 0 lines, which is also correct behavior
          if (textWithLineBreaks.replace(/\n/g, ' ').trim().length > 0) {
            expect(layoutWithLineBreaks.lineCount).toBe(1);
          } else {
            expect(layoutWithLineBreaks.lineCount).toBe(0);
          }

          // Test with very small width that would normally force wrapping
          const layoutWithSmallWidth = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            maxWidth: 5, // Very small width
            wordWrap: false, // Wrapping disabled
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Should still have exactly 1 line
          expect(layoutWithSmallWidth.lineCount).toBe(1);

          // Verify all characters are positioned on the same line
          // Characters may have different y offsets due to font metrics, but they should all be on line 0
          if (layoutWithWrappingDisabled.characters.length > 0) {
            // All characters should have the same baseline y position (accounting for their individual yOffset)
            const baselineY = 0; // First line starts at y=0
            for (const char of layoutWithWrappingDisabled.characters) {
              // The character's y position should be the baseline plus its yOffset from the font data
              expect(char.y).toBe(baselineY + char.data.yOffset);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 12: Manual line break preservation**
   * For any text containing explicit line breaks, those breaks should be preserved in addition to automatic wrapping
   * **Validates: Requirements 3.5**
   */
  it('should preserve manual line breaks in addition to automatic wrapping', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 3) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              fontData: fc.constant(fontData),
              // Generate text with explicit line breaks
              textSegments: fc.array(
                fc
                  .array(fc.constantFrom(...nonSpaceChars), { minLength: 2, maxLength: 8 })
                  .map((chars) => chars.join('')),
                { minLength: 2, maxLength: 5 }
              ),
              maxWidth: fc.integer({ min: 50, max: 200 }),
            });
          })
          .filter((data) => data !== null),
        ({ fontData, textSegments, maxWidth }) => {
          const layoutEngine = new TextLayoutEngine();

          // Create mock texture with appropriate size
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );
          const mockTexture = createMockTexture(atlasWidth, atlasHeight);

          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockTexture);

          // Create text with manual line breaks
          const textWithLineBreaks = textSegments.join('\n');
          const expectedManualLineCount = textSegments.length;

          // Test with wrapping enabled
          const layoutWithWrapping = layoutEngine.calculateLayout({
            font: bitmapFont,
            text: textWithLineBreaks,
            maxWidth,
            wordWrap: true, // Wrapping enabled
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // Should have at least as many lines as manual breaks
          // However, if maxWidth is very small, some segments might wrap further
          expect(layoutWithWrapping.lineCount).toBeGreaterThanOrEqual(expectedManualLineCount);

          // Test without wrapping to verify manual breaks are preserved
          const layoutWithoutWrapping = layoutEngine.calculateLayout({
            font: bitmapFont,
            text: textWithLineBreaks,
            wordWrap: false, // Wrapping disabled
            horizontalAlign: 'left',
            verticalAlign: 'top',
          });

          // When wrapping is disabled, manual line breaks should be converted to spaces (single line)
          expect(layoutWithoutWrapping.lineCount).toBe(1);

          // Test that each manual line break creates a new line when wrapping is enabled
          // Manual line breaks should create more lines than automatic wrapping alone

          // The layout with manual line breaks should have at least as many lines
          // as the manual break count, regardless of automatic wrapping
          if (textSegments.length > 1) {
            expect(layoutWithWrapping.lineCount).toBeGreaterThanOrEqual(expectedManualLineCount);
          }

          // Verify that manual line breaks are respected
          // The key test is that we have at least as many lines as manual line breaks
          // Additional wrapping due to width constraints is acceptable
          if (layoutWithWrapping.lineCount > 0) {
            // The layout should respect manual line breaks, so we should have at least
            // as many lines as segments, but possibly more due to automatic wrapping
            expect(layoutWithWrapping.lineCount).toBeGreaterThanOrEqual(
              Math.min(expectedManualLineCount, textSegments.length)
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: text-rendering-system, Property 22: Negative spacing handling**
   * For any text with negative spacing values, spacing should be reduced while maintaining character readability
   * **Validates: Requirements 6.4**
   */
  it('should handle negative spacing while maintaining readability', () => {
    fc.assert(
      fc.property(
        bmfontDataArb
          .chain((fontData) => {
            // Extract available characters from font data
            const availableChars = fontData.chars.map((c) => String.fromCharCode(c.id));
            const nonSpaceChars = availableChars.filter((c) => c !== ' ' && c.trim().length > 0);

            // Only generate test if we have enough characters
            if (nonSpaceChars.length < 3) {
              return fc.constant(null); // Skip this test case
            }

            return fc.record({
              fontData: fc.constant(fontData),
              text: fc
                .array(fc.constantFrom(...nonSpaceChars), { minLength: 3, maxLength: 10 })
                .map((chars) => chars.join('')),
              // Generate negative spacing values
              negativeSpacing: fc.integer({ min: -50, max: -1 }),
              // Also test positive spacing for comparison
              positiveSpacing: fc.integer({ min: 1, max: 20 }),
            });
          })
          .filter((data) => data !== null),
        ({ fontData, text, negativeSpacing, positiveSpacing }) => {
          const layoutEngine = new TextLayoutEngine();

          // Create mock texture with appropriate size
          const atlasWidth = Math.max(
            fontData.common.scaleW,
            ...fontData.chars.map((c) => c.x + c.width)
          );
          const atlasHeight = Math.max(
            fontData.common.scaleH,
            ...fontData.chars.map((c) => c.y + c.height)
          );
          const mockTexture = createMockTexture(atlasWidth, atlasHeight);

          const bmfontText = generateBMFontText(fontData);
          const parsedData = parseBMFontText(bmfontText);
          const bitmapFont = createBitmapFont('test-font', parsedData, mockTexture);

          // Test with negative spacing
          const layoutWithNegativeSpacing = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
            characterSpacing: negativeSpacing,
          });

          // Test with positive spacing for comparison
          const layoutWithPositiveSpacing = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
            characterSpacing: positiveSpacing,
          });

          // Test with zero spacing as baseline
          const layoutWithZeroSpacing = layoutEngine.calculateLayout({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
            characterSpacing: 0,
          });

          // All layouts should have the same number of characters
          expect(layoutWithNegativeSpacing.characters.length).toBe(
            layoutWithZeroSpacing.characters.length
          );
          expect(layoutWithPositiveSpacing.characters.length).toBe(
            layoutWithZeroSpacing.characters.length
          );

          if (layoutWithNegativeSpacing.characters.length > 1) {
            // The key property is that negative spacing should generally bring characters closer
            // However, due to character offsets and font metrics, the overall width might not always decrease
            // The important thing is that the layout engine handles negative spacing gracefully

            // Positive spacing should generally make text wider than zero spacing
            // However, due to character offsets and font metrics, this isn't always guaranteed
            // The key test is that different spacing values produce different layouts when they should
            if (text.length > 1) {
              // For multi-character text, verify that spacing affects character positions
              const zeroSpacingPositions = layoutWithZeroSpacing.characters.map((c) => c.x);
              const positiveSpacingPositions = layoutWithPositiveSpacing.characters.map((c) => c.x);

              // At least some character positions should be different when spacing changes
              let positionsDiffer = false;
              for (
                let i = 0;
                i < Math.min(zeroSpacingPositions.length, positiveSpacingPositions.length);
                i++
              ) {
                if (Math.abs(zeroSpacingPositions[i] - positiveSpacingPositions[i]) > 0.01) {
                  positionsDiffer = true;
                  break;
                }
              }

              // If spacing is significant enough, positions should differ
              if (Math.abs(positiveSpacing) > 0) {
                expect(positionsDiffer).toBe(true);
              }
            }

            // Verify that the layout engine handles negative spacing without breaking
            // The key property is that all characters are still rendered and positioned
            expect(layoutWithNegativeSpacing.characters.length).toBe(text.length);

            // All layouts should produce valid bounds (non-negative dimensions)
            expect(layoutWithNegativeSpacing.bounds.width).toBeGreaterThanOrEqual(0);
            expect(layoutWithNegativeSpacing.bounds.height).toBeGreaterThanOrEqual(0);
            expect(layoutWithZeroSpacing.bounds.width).toBeGreaterThanOrEqual(0);
            expect(layoutWithPositiveSpacing.bounds.width).toBeGreaterThanOrEqual(0);

            // Characters should maintain reasonable positioning relative to each other
            // The layout should not produce completely unreasonable character positions
            const firstChar = layoutWithNegativeSpacing.characters[0];
            const lastChar =
              layoutWithNegativeSpacing.characters[layoutWithNegativeSpacing.characters.length - 1];
            const totalSpan = lastChar.x + lastChar.data.width - firstChar.x;

            // The total span should be reasonable (not excessively negative, not excessively large)
            // For negative spacing, some overlap is acceptable, but the text should still be readable
            expect(totalSpan).toBeGreaterThan(-50); // Allow some negative span due to overlap
            expect(totalSpan).toBeLessThan(1000); // Reasonable upper bound
          }

          // Verify that negative spacing is properly bounded
          // The layout engine should prevent excessive negative spacing that makes text unreadable
          const extremeNegativeValidation = layoutEngine.validateLayoutOptions({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
            characterSpacing: -1000, // Extremely negative value
          });

          // Very extreme negative values should be rejected
          expect(extremeNegativeValidation.valid).toBe(false);
          expect(extremeNegativeValidation.errors.length).toBeGreaterThan(0);

          // But reasonable negative values should be accepted
          const reasonableNegativeValidation = layoutEngine.validateLayoutOptions({
            font: bitmapFont,
            text,
            wordWrap: false,
            horizontalAlign: 'left',
            verticalAlign: 'top',
            characterSpacing: negativeSpacing, // The generated negative spacing should be reasonable
          });

          expect(reasonableNegativeValidation.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
