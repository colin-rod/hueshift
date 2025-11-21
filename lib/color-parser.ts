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
