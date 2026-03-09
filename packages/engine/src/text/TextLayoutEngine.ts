import {
  BitmapFont,
  TextLayoutOptions,
  LayoutResult,
  CharacterLayout,
  TextBounds,
  LineLayout,
} from './types';

/**
 * Text layout engine that handles character positioning, word wrapping, and alignment
 */
export class TextLayoutEngine {
  /**
   * Calculate the layout for the given text and options
   */
  calculateLayout(options: TextLayoutOptions): LayoutResult {
    const { font, text } = options;

    // Handle empty or null text content gracefully
    if (!text || text.length === 0 || this.isEmptyText(text)) {
      return {
        characters: [],
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        lineCount: 0,
      };
    }

    // Validate and sanitize layout parameters
    const sanitizedOptions = this.sanitizeLayoutOptions(options);

    const effectiveLineHeight = sanitizedOptions.lineHeight ?? font.lineHeight;
    const effectiveCharSpacing = sanitizedOptions.characterSpacing ?? 0;

    // Handle text line processing based on wrapping settings
    const allLines: LineLayout[] = [];

    if (!sanitizedOptions.wordWrap) {
      // When wrapping is disabled, render all text on a single line
      // Join all lines with spaces to preserve manual line breaks as spaces
      const singleLineText = sanitizedOptions.text.replace(/\n/g, ' ');
      const line = this.layoutLine(singleLineText, font, effectiveCharSpacing);
      allLines.push(line);
    } else {
      // Split text into lines based on manual line breaks first
      const textLines = sanitizedOptions.text.split('\n');

      for (const textLine of textLines) {
        if (sanitizedOptions.maxWidth !== undefined) {
          // Apply word wrapping to this line
          const wrappedLines = this.wrapLine(
            textLine,
            font,
            sanitizedOptions.maxWidth,
            effectiveCharSpacing
          );
          allLines.push(...wrappedLines);
        } else {
          // No width limit, layout the entire line
          const line = this.layoutLine(textLine, font, effectiveCharSpacing);
          allLines.push(line);
        }
      }
    }

    // Position lines vertically
    const characters: CharacterLayout[] = [];
    let currentY = 0;

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];

      // Position each character in the line
      for (const char of line.characters) {
        characters.push({
          ...char,
          y: char.y + currentY,
        });
      }

      // Move to next line position
      currentY += effectiveLineHeight;
    }

    // Calculate bounds
    const bounds = this.calculateBounds(characters);

    // Apply alignment adjustments
    const alignedCharacters = this.applyAlignment(
      characters,
      bounds,
      sanitizedOptions.horizontalAlign,
      sanitizedOptions.verticalAlign
    );

    // Recalculate bounds after alignment
    const finalBounds = this.calculateBounds(alignedCharacters);

    return {
      characters: alignedCharacters,
      bounds: finalBounds,
      lineCount: allLines.length,
    };
  }

  /**
   * Wrap a single line of text based on word boundaries
   */
  private wrapLine(
    text: string,
    font: BitmapFont,
    maxWidth: number,
    characterSpacing: number
  ): LineLayout[] {
    const lines: LineLayout[] = [];
    const words = this.splitIntoWords(text);

    let currentLine: CharacterLayout[] = [];
    let currentWidth = 0;

    for (const word of words) {
      const wordLayout = this.layoutWord(word, font, characterSpacing, currentWidth);
      const wordWidth = this.calculateWordWidth(wordLayout);

      // Check if word fits on current line
      if (currentWidth + wordWidth <= maxWidth) {
        // Word fits, add to current line
        currentLine.push(...wordLayout);
        currentWidth += wordWidth;
      } else {
        // Word doesn't fit, start new line
        if (currentLine.length > 0) {
          lines.push(this.createLineLayout(currentLine));
          currentLine = [];
          currentWidth = 0;
        }

        // Check if word itself is too long for a line
        if (wordWidth > maxWidth) {
          // Break word at character boundaries
          const brokenLines = this.breakWordAtCharacters(word, font, maxWidth, characterSpacing);
          lines.push(...brokenLines);
        } else {
          // Word fits on new line
          const wordLayoutFromStart = this.layoutWord(word, font, characterSpacing, 0);
          currentLine.push(...wordLayoutFromStart);
          currentWidth = wordWidth;
        }
      }
    }

    // Add remaining characters as final line
    if (currentLine.length > 0) {
      lines.push(this.createLineLayout(currentLine));
    }

    return lines;
  }

  /**
   * Break a word at character boundaries when it's too long for a line
   */
  private breakWordAtCharacters(
    word: string,
    font: BitmapFont,
    maxWidth: number,
    characterSpacing: number
  ): LineLayout[] {
    const lines: LineLayout[] = [];
    let currentLine: CharacterLayout[] = [];
    let currentX = 0;

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const charData = font.characters.get(char);

      if (!charData) {
        // Skip unsupported characters (should be rare after sanitization)
        continue;
      }

      // Calculate the space this character will take, handling negative spacing
      let effectiveSpacing = i < word.length - 1 ? characterSpacing : 0;

      // For negative spacing, ensure we don't create excessive overlap
      if (effectiveSpacing < 0 && currentLine.length > 0) {
        const prevChar = currentLine[currentLine.length - 1];
        const minSpacing = -(prevChar.data.width * 0.8); // Max 80% overlap
        effectiveSpacing = Math.max(effectiveSpacing, minSpacing);
      }

      const charAdvance = charData.xAdvance + effectiveSpacing;
      const charRightEdge = currentX + charData.xOffset + charData.width;

      // Check if character fits on current line
      if (currentLine.length === 0 || charRightEdge <= maxWidth) {
        // Character fits on current line
        const charLayout: CharacterLayout = {
          char,
          x: currentX + charData.xOffset,
          y: charData.yOffset,
          data: charData,
        };
        currentLine.push(charLayout);
        currentX += charAdvance;
      } else {
        // Character doesn't fit, finish current line and start new one
        if (currentLine.length > 0) {
          lines.push(this.createLineLayout(currentLine));
        }

        // Start new line with this character
        currentX = 0;
        const charLayout: CharacterLayout = {
          char,
          x: currentX + charData.xOffset,
          y: charData.yOffset,
          data: charData,
        };
        currentLine = [charLayout];
        currentX += charAdvance;
      }
    }

    // Add remaining characters as final line
    if (currentLine.length > 0) {
      lines.push(this.createLineLayout(currentLine));
    }

    return lines;
  }

  /**
   * Layout a single line of text without wrapping
   */
  private layoutLine(text: string, font: BitmapFont, characterSpacing: number): LineLayout {
    const characters: CharacterLayout[] = [];
    let currentX = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charData = font.characters.get(char);

      if (!charData) {
        // Skip unsupported characters (should be rare after sanitization)
        continue;
      }

      // Apply kerning if available
      const kerning = this.getKerning(font, text, i);
      currentX += kerning;

      const charLayout: CharacterLayout = {
        char,
        x: currentX + charData.xOffset,
        y: charData.yOffset,
        data: charData,
      };

      characters.push(charLayout);

      // Advance position for next character
      currentX += charData.xAdvance;

      // Add character spacing (except for last character)
      // Handle negative spacing by ensuring minimum readability
      if (i < text.length - 1) {
        const effectiveSpacing = characterSpacing;
        currentX += effectiveSpacing;

        // Ensure negative spacing doesn't cause characters to overlap excessively
        // This is already handled in sanitizeLayoutOptions, but we double-check here
        if (effectiveSpacing < 0) {
          // Ensure we don't go backwards beyond the current character's left edge
          const minX = charLayout.x + charData.width * 0.2; // Allow 20% overlap max
          if (currentX < minX) {
            currentX = minX;
          }
        }
      }
    }

    return this.createLineLayout(characters);
  }

  /**
   * Layout a word starting at the given x position
   */
  private layoutWord(
    word: string,
    font: BitmapFont,
    characterSpacing: number,
    startX: number
  ): CharacterLayout[] {
    const characters: CharacterLayout[] = [];
    let currentX = startX;

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const charData = font.characters.get(char);

      if (!charData) {
        // Skip unsupported characters (should be rare after sanitization)
        continue;
      }

      // Apply kerning if available
      const kerning = this.getKerning(font, word, i);
      currentX += kerning;

      const charLayout: CharacterLayout = {
        char,
        x: currentX + charData.xOffset,
        y: charData.yOffset,
        data: charData,
      };

      characters.push(charLayout);
      currentX += charData.xAdvance;

      // Add character spacing (except for last character)
      // Handle negative spacing with bounds checking
      if (i < word.length - 1) {
        const effectiveSpacing = characterSpacing;
        currentX += effectiveSpacing;

        // Ensure negative spacing doesn't cause excessive overlap
        if (effectiveSpacing < 0) {
          const minX = charLayout.x + charData.width * 0.2; // Allow 20% overlap max
          if (currentX < minX) {
            currentX = minX;
          }
        }
      }
    }

    return characters;
  }

  /**
   * Get kerning adjustment for character pair
   */
  private getKerning(font: BitmapFont, text: string, index: number): number {
    if (index === 0 || index >= text.length) {
      return 0;
    }

    const prevChar = text[index - 1];
    const currentChar = text[index];
    const kerningKey = `${prevChar}${currentChar}`;

    return font.kerningPairs.get(kerningKey) ?? 0;
  }

  /**
   * Split text into words, preserving spaces
   */
  private splitIntoWords(text: string): string[] {
    const words: string[] = [];
    let currentWord = '';

    for (const char of text) {
      if (char === ' ') {
        if (currentWord) {
          words.push(currentWord);
          currentWord = '';
        }
        words.push(' '); // Preserve space as separate word
      } else {
        currentWord += char;
      }
    }

    if (currentWord) {
      words.push(currentWord);
    }

    return words;
  }

  /**
   * Calculate the width of a word layout
   */
  private calculateWordWidth(characters: CharacterLayout[]): number {
    if (characters.length === 0) {
      return 0;
    }

    // Find the rightmost edge of all characters
    let maxRight = 0;
    let minLeft = Infinity;

    for (const char of characters) {
      const left = char.x;
      const right = char.x + char.data.width;
      minLeft = Math.min(minLeft, left);
      maxRight = Math.max(maxRight, right);
    }

    return maxRight - minLeft;
  }

  /**
   * Create a line layout from character layouts
   */
  private createLineLayout(characters: CharacterLayout[]): LineLayout {
    if (characters.length === 0) {
      return {
        characters: [],
        width: 0,
        height: 0,
        baseline: 0,
      };
    }

    const width = this.calculateWordWidth(characters);

    // Calculate line height based on character heights
    let maxHeight = 0;
    let maxBaseline = 0;

    for (const char of characters) {
      const charHeight = char.data.height + Math.abs(char.data.yOffset);
      maxHeight = Math.max(maxHeight, charHeight);
      maxBaseline = Math.max(maxBaseline, Math.abs(char.data.yOffset));
    }

    return {
      characters,
      width,
      height: maxHeight,
      baseline: maxBaseline,
    };
  }

  /**
   * Calculate bounds for a set of characters
   */
  private calculateBounds(characters: CharacterLayout[]): TextBounds {
    if (characters.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const char of characters) {
      const left = char.x;
      const right = char.x + char.data.width;
      const top = char.y;
      const bottom = char.y + char.data.height;

      minX = Math.min(minX, left);
      maxX = Math.max(maxX, right);
      minY = Math.min(minY, top);
      maxY = Math.max(maxY, bottom);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Apply horizontal and vertical alignment to character positions
   */
  private applyAlignment(
    characters: CharacterLayout[],
    bounds: TextBounds,
    horizontalAlign: 'left' | 'center' | 'right',
    verticalAlign: 'top' | 'middle' | 'bottom'
  ): CharacterLayout[] {
    if (characters.length === 0) {
      return characters;
    }

    // Calculate alignment offsets
    let offsetX = 0;
    let offsetY = 0;

    // Horizontal alignment
    switch (horizontalAlign) {
      case 'center':
        offsetX = -bounds.width / 2;
        break;
      case 'right':
        offsetX = -bounds.width;
        break;
      case 'left':
      default:
        offsetX = 0;
        break;
    }

    // Vertical alignment
    switch (verticalAlign) {
      case 'middle':
        offsetY = -bounds.height / 2;
        break;
      case 'bottom':
        offsetY = -bounds.height;
        break;
      case 'top':
      default:
        offsetY = 0;
        break;
    }

    // Apply offsets to all characters
    return characters.map((char) => ({
      ...char,
      x: char.x + offsetX,
      y: char.y + offsetY,
    }));
  }

  /**
   * Check if text content is empty (null, undefined, or whitespace only)
   */
  private isEmptyText(text: string | null | undefined): boolean {
    return !text || text.trim().length === 0;
  }

  /**
   * Sanitize and validate layout options, providing safe defaults
   */
  private sanitizeLayoutOptions(options: TextLayoutOptions): TextLayoutOptions {
    const sanitized = { ...options };

    // Sanitize text content - replace unsupported characters with fallback
    sanitized.text = this.sanitizeTextContent(options.text, options.font);

    // Validate and clamp maxWidth
    if (sanitized.maxWidth !== undefined) {
      sanitized.maxWidth = Math.max(0, sanitized.maxWidth);
      // If maxWidth is too small, disable word wrapping
      if (sanitized.maxWidth < 10) {
        sanitized.wordWrap = false;
      }
    }

    // Validate line height (allow negative values but with bounds checking)
    if (sanitized.lineHeight !== undefined) {
      // Allow negative line height but clamp to reasonable bounds
      sanitized.lineHeight = Math.max(-200, Math.min(500, sanitized.lineHeight));
      // Ensure minimum readable line height
      if (Math.abs(sanitized.lineHeight) < 1) {
        sanitized.lineHeight = sanitized.lineHeight >= 0 ? 1 : -1;
      }
    }

    // Validate character spacing (allow negative but within reasonable bounds)
    if (sanitized.characterSpacing !== undefined) {
      // Enhanced bounds checking for negative spacing
      sanitized.characterSpacing = Math.max(-100, Math.min(200, sanitized.characterSpacing));

      // Ensure negative spacing doesn't make text completely unreadable
      // by checking against font metrics
      const avgCharWidth = this.getAverageCharacterWidth(options.font);
      const minSpacing = -avgCharWidth * 0.8; // Don't allow more than 80% overlap
      if (sanitized.characterSpacing < minSpacing) {
        sanitized.characterSpacing = minSpacing;
      }
    }

    // Ensure valid alignment values
    const validHorizontalAlign = ['left', 'center', 'right'];
    const validVerticalAlign = ['top', 'middle', 'bottom'];

    if (!validHorizontalAlign.includes(sanitized.horizontalAlign)) {
      sanitized.horizontalAlign = 'left';
    }

    if (!validVerticalAlign.includes(sanitized.verticalAlign)) {
      sanitized.verticalAlign = 'top';
    }

    return sanitized;
  }

  /**
   * Sanitize text content by handling unsupported characters
   */
  private sanitizeTextContent(text: string, font: BitmapFont): string {
    if (!text) return '';

    let sanitized = '';
    const fallbackChar = this.getFallbackCharacter(font);

    for (const char of text) {
      // Keep line breaks and spaces as-is
      if (char === '\n' || char === ' ') {
        sanitized += char;
        continue;
      }

      // Check if character is supported by the font
      if (font.characters.has(char)) {
        sanitized += char;
      } else if (fallbackChar) {
        // Use fallback character for unsupported characters
        sanitized += fallbackChar;
      }
      // If no fallback available, skip the character (implicit handling)
    }

    return sanitized;
  }

  /**
   * Get a fallback character from the font (prefer '?' or first available character)
   */
  private getFallbackCharacter(font: BitmapFont): string | null {
    // Try common fallback characters in order of preference
    const fallbackCandidates = ['?', '*', '.', 'X', 'A'];

    for (const candidate of fallbackCandidates) {
      if (font.characters.has(candidate)) {
        return candidate;
      }
    }

    // If no common fallback found, use the first available character
    const firstChar = font.characters.keys().next().value;
    return firstChar || null;
  }

  /**
   * Calculate average character width for the font (used for negative spacing bounds)
   */
  private getAverageCharacterWidth(font: BitmapFont): number {
    if (font.characters.size === 0) {
      return 10; // Default fallback width
    }

    let totalWidth = 0;
    let count = 0;

    // Sample common characters to get a representative average
    const sampleChars = ['a', 'e', 'i', 'o', 'u', 'n', 't', 's', 'r', 'l'];

    for (const char of sampleChars) {
      const charData = font.characters.get(char);
      if (charData) {
        totalWidth += charData.xAdvance;
        count++;
      }
    }

    // If no sample characters found, use all available characters
    if (count === 0) {
      for (const charData of font.characters.values()) {
        totalWidth += charData.xAdvance;
        count++;
      }
    }

    return count > 0 ? totalWidth / count : 10;
  }

  /**
   * Validate layout parameters and provide error information
   */
  validateLayoutOptions(options: TextLayoutOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.font) {
      errors.push('Font is required');
    }

    if (options.maxWidth !== undefined && options.maxWidth < 0) {
      errors.push('maxWidth must be non-negative');
    }

    if (options.lineHeight !== undefined && options.lineHeight <= 0) {
      errors.push('lineHeight must be positive');
    }

    if (
      options.characterSpacing !== undefined &&
      (options.characterSpacing < -100 || options.characterSpacing > 200)
    ) {
      errors.push('characterSpacing must be between -100 and 200');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
