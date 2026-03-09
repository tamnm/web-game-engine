import { CharacterData, BitmapFont } from './types';
import { Texture } from '../rendering/types';

/**
 * Raw BMFont data structure as parsed from .fnt file
 */
export interface RawBMFontData {
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
  pages: Array<{
    id: number;
    file: string;
  }>;
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
  kernings?: Array<{
    first: number;
    second: number;
    amount: number;
  }>;
}

/**
 * Parse a line into tokens, handling quoted strings properly
 */
function parseLineTokens(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < line.length) {
    // Skip whitespace
    while (i < line.length && line[i] === ' ') {
      i++;
    }

    if (i >= line.length) break;

    let token = '';

    // Read until space, but handle quoted values
    while (i < line.length && line[i] !== ' ') {
      if (line[i] === '"') {
        // We found a quote, read the quoted content
        i++; // Skip opening quote
        while (i < line.length && line[i] !== '"') {
          token += line[i];
          i++;
        }
        if (i < line.length) {
          i++; // Skip closing quote
        }
      } else {
        token += line[i];
        i++;
      }
    }

    if (token.length > 0) {
      tokens.push(token);
    }
  }

  return tokens;
}

/**
 * Parse a BMFont .fnt file content into structured data
 */
export function parseBMFontText(content: string): RawBMFontData {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result: RawBMFontData = {
    info: {
      face: '',
      size: 0,
      bold: 0,
      italic: 0,
      charset: '',
      unicode: 0,
      stretchH: 0,
      smooth: 0,
      aa: 0,
      padding: [0, 0, 0, 0],
      spacing: [0, 0],
    },
    common: {
      lineHeight: 0,
      base: 0,
      scaleW: 0,
      scaleH: 0,
      pages: 0,
      packed: 0,
      alphaChnl: 0,
      redChnl: 0,
      greenChnl: 0,
      blueChnl: 0,
    },
    pages: [],
    chars: [],
    kernings: [],
  };

  for (const line of lines) {
    const parts = parseLineTokens(line);
    const command = parts[0];

    switch (command) {
      case 'info':
        result.info = parseInfoLine(parts);
        break;
      case 'common':
        result.common = parseCommonLine(parts);
        break;
      case 'page':
        result.pages.push(parsePageLine(parts));
        break;
      case 'char':
        result.chars.push(parseCharLine(parts));
        break;
      case 'kerning':
        if (!result.kernings) result.kernings = [];
        result.kernings.push(parseKerningLine(parts));
        break;
    }
  }

  return result;
}

/**
 * Parse info line from BMFont file
 */
function parseInfoLine(parts: string[]): RawBMFontData['info'] {
  const info: RawBMFontData['info'] = {
    face: '',
    size: 0,
    bold: 0,
    italic: 0,
    charset: '',
    unicode: 0,
    stretchH: 0,
    smooth: 0,
    aa: 0,
    padding: [0, 0, 0, 0],
    spacing: [0, 0],
  };

  for (let i = 1; i < parts.length; i++) {
    const equalIndex = parts[i].indexOf('=');
    if (equalIndex === -1) continue;

    const key = parts[i].substring(0, equalIndex);
    const value = parts[i].substring(equalIndex + 1);

    switch (key) {
      case 'face':
        info.face = value;
        break;
      case 'size':
        info.size = parseInt(value, 10);
        break;
      case 'bold':
        info.bold = parseInt(value, 10);
        break;
      case 'italic':
        info.italic = parseInt(value, 10);
        break;
      case 'charset':
        info.charset = value;
        break;
      case 'unicode':
        info.unicode = parseInt(value, 10);
        break;
      case 'stretchH':
        info.stretchH = parseInt(value, 10);
        break;
      case 'smooth':
        info.smooth = parseInt(value, 10);
        break;
      case 'aa':
        info.aa = parseInt(value, 10);
        break;
      case 'padding': {
        const paddingValues = value.split(',').map((v) => parseInt(v, 10));
        info.padding = [paddingValues[0], paddingValues[1], paddingValues[2], paddingValues[3]];
        break;
      }
      case 'spacing': {
        const spacingValues = value.split(',').map((v) => parseInt(v, 10));
        info.spacing = [spacingValues[0], spacingValues[1]];
        break;
      }
    }
  }

  return info;
}

/**
 * Parse common line from BMFont file
 */
function parseCommonLine(parts: string[]): RawBMFontData['common'] {
  const common: RawBMFontData['common'] = {
    lineHeight: 0,
    base: 0,
    scaleW: 0,
    scaleH: 0,
    pages: 0,
    packed: 0,
    alphaChnl: 0,
    redChnl: 0,
    greenChnl: 0,
    blueChnl: 0,
  };

  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split('=');
    switch (key) {
      case 'lineHeight':
        common.lineHeight = parseInt(value, 10);
        break;
      case 'base':
        common.base = parseInt(value, 10);
        break;
      case 'scaleW':
        common.scaleW = parseInt(value, 10);
        break;
      case 'scaleH':
        common.scaleH = parseInt(value, 10);
        break;
      case 'pages':
        common.pages = parseInt(value, 10);
        break;
      case 'packed':
        common.packed = parseInt(value, 10);
        break;
      case 'alphaChnl':
        common.alphaChnl = parseInt(value, 10);
        break;
      case 'redChnl':
        common.redChnl = parseInt(value, 10);
        break;
      case 'greenChnl':
        common.greenChnl = parseInt(value, 10);
        break;
      case 'blueChnl':
        common.blueChnl = parseInt(value, 10);
        break;
    }
  }

  return common;
}

/**
 * Parse page line from BMFont file
 */
function parsePageLine(parts: string[]): { id: number; file: string } {
  let id = 0;
  let file = '';

  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split('=');
    switch (key) {
      case 'id':
        id = parseInt(value, 10);
        break;
      case 'file':
        file = value;
        break;
    }
  }

  return { id, file };
}

/**
 * Parse char line from BMFont file
 */
function parseCharLine(parts: string[]): RawBMFontData['chars'][0] {
  const char: RawBMFontData['chars'][0] = {
    id: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    xoffset: 0,
    yoffset: 0,
    xadvance: 0,
    page: 0,
    chnl: 0,
  };

  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split('=');
    switch (key) {
      case 'id':
        char.id = parseInt(value, 10);
        break;
      case 'x':
        char.x = parseInt(value, 10);
        break;
      case 'y':
        char.y = parseInt(value, 10);
        break;
      case 'width':
        char.width = parseInt(value, 10);
        break;
      case 'height':
        char.height = parseInt(value, 10);
        break;
      case 'xoffset':
        char.xoffset = parseInt(value, 10);
        break;
      case 'yoffset':
        char.yoffset = parseInt(value, 10);
        break;
      case 'xadvance':
        char.xadvance = parseInt(value, 10);
        break;
      case 'page':
        char.page = parseInt(value, 10);
        break;
      case 'chnl':
        char.chnl = parseInt(value, 10);
        break;
    }
  }

  return char;
}

/**
 * Parse kerning line from BMFont file
 */
function parseKerningLine(parts: string[]): { first: number; second: number; amount: number } {
  let first = 0;
  let second = 0;
  let amount = 0;

  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split('=');
    switch (key) {
      case 'first':
        first = parseInt(value, 10);
        break;
      case 'second':
        second = parseInt(value, 10);
        break;
      case 'amount':
        amount = parseInt(value, 10);
        break;
    }
  }

  return { first, second, amount };
}

/**
 * Convert raw BMFont data to BitmapFont interface
 */
export function createBitmapFont(id: string, rawData: RawBMFontData, atlas: Texture): BitmapFont {
  // Convert character data
  const characters = new Map<string, CharacterData>();
  for (const rawChar of rawData.chars) {
    const char = String.fromCharCode(rawChar.id);
    characters.set(char, {
      char,
      x: rawChar.x,
      y: rawChar.y,
      width: rawChar.width,
      height: rawChar.height,
      xOffset: rawChar.xoffset,
      yOffset: rawChar.yoffset,
      xAdvance: rawChar.xadvance,
    });
  }

  // Convert kerning data
  const kerningPairs = new Map<string, number>();
  if (rawData.kernings) {
    for (const kerning of rawData.kernings) {
      const first = String.fromCharCode(kerning.first);
      const second = String.fromCharCode(kerning.second);
      const key = first + second;
      kerningPairs.set(key, kerning.amount);
    }
  }

  return {
    id,
    atlas,
    lineHeight: rawData.common.lineHeight,
    baseline: rawData.common.base,
    characters,
    kerningPairs,
  };
}
