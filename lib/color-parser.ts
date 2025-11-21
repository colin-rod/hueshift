import tinycolor from "tinycolor2";

export interface ParsedColor {
  id: string; // Unique identifier for this color instance
  original: string; // The exact string found in the text
  normalized: string; // Normalized hex format
  format: "hex" | "rgb" | "hsl" | "named";
  startIndex: number; // Position in text where color starts
  endIndex: number; // Position in text where color ends
  count?: number; // Number of times this color appears
}

// Named CSS colors list for validation
const CSS_NAMED_COLORS = [
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black",
  "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse",
  "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue",
  "darkcyan", "darkgoldenrod", "darkgray", "darkgrey", "darkgreen", "darkkhaki",
  "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon",
  "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise",
  "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick",
  "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
  "gray", "grey", "green", "greenyellow", "honeydew", "hotpink", "indianred", "indigo",
  "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
  "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgrey", "lightgreen",
  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
  "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta",
  "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
  "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue",
  "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab",
  "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
  "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple",
  "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown",
  "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey",
  "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet",
  "wheat", "white", "whitesmoke", "yellow", "yellowgreen"
];

/**
 * Parse all color values from text
 */
export function parseColors(text: string): ParsedColor[] {
  const colors: ParsedColor[] = [];
  const seenColors = new Map<string, number>(); // normalized -> count

  // Regex patterns for different color formats
  const patterns = [
    // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
    {
      regex: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
      format: "hex" as const,
    },
    // RGB/RGBA: rgb(r,g,b) or rgba(r,g,b,a)
    {
      regex: /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)/gi,
      format: "rgb" as const,
    },
    // HSL/HSLA: hsl(h,s%,l%) or hsla(h,s%,l%,a)
    {
      regex: /hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*([\d.]+)\s*)?\)/gi,
      format: "hsl" as const,
    },
  ];

  // Parse structured color formats (hex, rgb, hsl)
  patterns.forEach(({ regex, format }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const color = tinycolor(original);

      if (color.isValid()) {
        const normalized = color.toHexString();
        const id = `${normalized}-${match.index}`;

        colors.push({
          id,
          original,
          normalized,
          format,
          startIndex: match.index,
          endIndex: match.index + original.length,
        });

        seenColors.set(normalized, (seenColors.get(normalized) || 0) + 1);
      }
    }
  });

  // Parse named colors - need to be more careful with word boundaries
  const namedColorRegex = new RegExp(
    `\\b(${CSS_NAMED_COLORS.join("|")})\\b`,
    "gi"
  );

  let match: RegExpExecArray | null;
  while ((match = namedColorRegex.exec(text)) !== null) {
    const original = match[0];
    const color = tinycolor(original);

    if (color.isValid()) {
      const normalized = color.toHexString();
      const matchIndex = match.index;
      const id = `${normalized}-${matchIndex}`;

      // Check if this position overlaps with already parsed colors
      const overlaps = colors.some(
        c => matchIndex >= c.startIndex && matchIndex < c.endIndex
      );

      if (!overlaps) {
        colors.push({
          id,
          original,
          normalized,
          format: "named",
          startIndex: matchIndex,
          endIndex: matchIndex + original.length,
        });

        seenColors.set(normalized, (seenColors.get(normalized) || 0) + 1);
      }
    }
  }

  // Sort by position in text
  colors.sort((a, b) => a.startIndex - b.startIndex);

  // Add count to each color
  colors.forEach(color => {
    color.count = seenColors.get(color.normalized) || 1;
  });

  return colors;
}

/**
 * Get unique colors from parsed results
 */
export function getUniqueColors(parsedColors: ParsedColor[]): ParsedColor[] {
  const uniqueMap = new Map<string, ParsedColor>();

  parsedColors.forEach(color => {
    if (!uniqueMap.has(color.normalized)) {
      uniqueMap.set(color.normalized, { ...color });
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Replace a specific color in text
 */
export function replaceColor(
  text: string,
  parsedColors: ParsedColor[],
  targetColor: string, // normalized hex
  replacement: string,
  mode: "all" | "selective",
  selectedIds?: string[] // for selective mode
): string {
  const color = tinycolor(replacement);
  if (!color.isValid()) {
    return text;
  }

  // Sort colors by position in reverse order to maintain indices
  const colorsToReplace = parsedColors
    .filter(c => {
      if (c.normalized !== targetColor) return false;
      if (mode === "selective" && selectedIds) {
        return selectedIds.includes(c.id);
      }
      return true;
    })
    .sort((a, b) => b.startIndex - a.startIndex);

  let result = text;

  colorsToReplace.forEach(colorInstance => {
    const before = result.substring(0, colorInstance.startIndex);
    const after = result.substring(colorInstance.endIndex);

    // Convert replacement to match the original format if possible
    let replacementStr = replacement;

    if (colorInstance.format === "rgb") {
      const rgb = tinycolor(replacement).toRgb();
      replacementStr = colorInstance.original.toLowerCase().includes("rgba")
        ? `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`
        : `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    } else if (colorInstance.format === "hsl") {
      const hsl = tinycolor(replacement).toHsl();
      replacementStr = colorInstance.original.toLowerCase().includes("hsla")
        ? `hsla(${Math.round(hsl.h)},${Math.round(hsl.s * 100)}%,${Math.round(hsl.l * 100)}%,${hsl.a})`
        : `hsl(${Math.round(hsl.h)},${Math.round(hsl.s * 100)}%,${Math.round(hsl.l * 100)}%)`;
    } else if (colorInstance.format === "hex") {
      // Keep alpha if original had it
      if (colorInstance.original.length === 9) {
        replacementStr = tinycolor(replacement).toHex8String();
      } else {
        replacementStr = tinycolor(replacement).toHexString();
      }
    }

    result = before + replacementStr + after;
  });

  return result;
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const c1 = tinycolor(color1);
  const c2 = tinycolor(color2);

  if (!c1.isValid() || !c2.isValid()) return 0;

  const lum1 = c1.getLuminance();
  const lum2 = c2.getLuminance();

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check WCAG compliance level
 */
export function getWCAGCompliance(ratio: number): {
  aa: { normal: boolean; large: boolean };
  aaa: { normal: boolean; large: boolean };
} {
  return {
    aa: {
      normal: ratio >= 4.5,
      large: ratio >= 3,
    },
    aaa: {
      normal: ratio >= 7,
      large: ratio >= 4.5,
    },
  };
}

/**
 * Suggest an accessible alternative color that meets WCAG standards
 * Preserves the original hue and saturation, adjusts lightness
 */
export function suggestAccessibleAlternative(
  color: string,
  backgroundColor: string,
  targetLevel: "AA" | "AAA" = "AA"
): { suggested: string; ratio: number } | null {
  const c = tinycolor(color);
  const bg = tinycolor(backgroundColor);

  if (!c.isValid() || !bg.isValid()) return null;

  const targetRatio = targetLevel === "AAA" ? 7 : 4.5;
  const currentRatio = getContrastRatio(color, backgroundColor);

  // Already passes the target level
  if (currentRatio >= targetRatio) {
    return { suggested: c.toHexString(), ratio: currentRatio };
  }

  const hsl = c.toHsl();
  const bgLuminance = bg.getLuminance();

  // Determine if we need to go lighter or darker
  const shouldGoLighter = bgLuminance < 0.5;

  // Try adjusting lightness in steps
  let bestColor = c.toHexString();
  let bestRatio = currentRatio;

  for (let step = 0; step <= 100; step++) {
    const adjustedHsl = { ...hsl };

    if (shouldGoLighter) {
      // Move towards white (100% lightness)
      adjustedHsl.l = hsl.l + ((1 - hsl.l) * step) / 100;
    } else {
      // Move towards black (0% lightness)
      adjustedHsl.l = hsl.l * (1 - step / 100);
    }

    const testColor = tinycolor(adjustedHsl).toHexString();
    const testRatio = getContrastRatio(testColor, backgroundColor);

    if (testRatio >= targetRatio) {
      return { suggested: testColor, ratio: testRatio };
    }

    if (testRatio > bestRatio) {
      bestColor = testColor;
      bestRatio = testRatio;
    }
  }

  // If we couldn't meet the target, return the best we found
  return bestRatio > currentRatio ? { suggested: bestColor, ratio: bestRatio } : null;
}

/**
 * Calculate Delta-E 2000 (CIEDE2000) color distance
 * Returns perceptual difference between two colors
 * 0 = identical, <5 = visually similar, >10 = clearly different
 */
export function getColorDistance(color1: string, color2: string): number {
  const c1 = tinycolor(color1);
  const c2 = tinycolor(color2);

  if (!c1.isValid() || !c2.isValid()) return Infinity;

  // Convert to LAB color space for Delta-E calculation
  const lab1 = rgbToLab(c1.toRgb());
  const lab2 = rgbToLab(c2.toRgb());

  // Simplified Delta-E calculation (using CIE76 for performance)
  // For production, consider using full CIEDE2000 implementation
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Convert RGB to LAB color space
 */
function rgbToLab(rgb: { r: number; g: number; b: number }): { l: number; a: number; b: number } {
  // Convert RGB to XYZ
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  // Convert XYZ to LAB (using D65 illuminant)
  const xn = 95.047;
  const yn = 100.0;
  const zn = 108.883;

  const fx = x / xn > 0.008856 ? Math.pow(x / xn, 1 / 3) : (7.787 * x / xn) + 16 / 116;
  const fy = y / yn > 0.008856 ? Math.pow(y / yn, 1 / 3) : (7.787 * y / yn) + 16 / 116;
  const fz = z / zn > 0.008856 ? Math.pow(z / zn, 1 / 3) : (7.787 * z / zn) + 16 / 116;

  const l = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const labB = 200 * (fy - fz);

  return { l, a, b: labB };
}

export interface SimilarColorGroup {
  representative: string; // Most frequently used color in the group
  similar: Array<{ color: string; distance: number; count: number }>; // Other similar colors
  totalCount: number; // Total occurrences across all colors in group
}

/**
 * Find groups of similar colors based on Delta-E distance
 * @param colors - Unique colors to analyze
 * @param threshold - Delta-E threshold for similarity (default: 8)
 */
export function findSimilarColorGroups(
  colors: ParsedColor[],
  threshold: number = 8
): SimilarColorGroup[] {
  const groups: SimilarColorGroup[] = [];
  const processed = new Set<string>();

  // Sort colors by count (most used first) to prioritize common colors as representatives
  const sortedColors = [...colors].sort((a, b) => (b.count || 0) - (a.count || 0));

  sortedColors.forEach(color => {
    if (processed.has(color.normalized)) return;

    const similarColors: Array<{ color: string; distance: number; count: number }> = [];
    let totalCount = color.count || 0;

    // Find all colors similar to this one
    sortedColors.forEach(otherColor => {
      if (color.normalized === otherColor.normalized || processed.has(otherColor.normalized)) {
        return;
      }

      const distance = getColorDistance(color.normalized, otherColor.normalized);

      if (distance <= threshold) {
        similarColors.push({
          color: otherColor.normalized,
          distance,
          count: otherColor.count || 0,
        });
        totalCount += otherColor.count || 0;
        processed.add(otherColor.normalized);
      }
    });

    // Only create a group if we found similar colors
    if (similarColors.length > 0) {
      processed.add(color.normalized);
      groups.push({
        representative: color.normalized,
        similar: similarColors.sort((a, b) => a.distance - b.distance),
        totalCount,
      });
    }
  });

  return groups;
}
