import tinycolor from "tinycolor2";
import { getContrastRatio, getWCAGCompliance } from "./color-parser";

export type CurveType = "linear" | "natural" | "accessibility";
export type ShadeNumber = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface PaletteShade {
  shade: ShadeNumber;
  hex: string;
  hsl: { h: number; s: number; l: number };
  contrastVsWhite: number;
  contrastVsBlack: number;
  wcagWhite: { aa: boolean; aaa: boolean };
  wcagBlack: { aa: boolean; aaa: boolean };
}

export interface TailwindPalette {
  name: string;
  baseColor: string;
  targetShade: ShadeNumber;
  curveType: CurveType;
  shades: PaletteShade[];
}

// Lightness curves for different shade generation strategies (in percentages)
const LIGHTNESS_CURVES: Record<CurveType, Record<ShadeNumber, number>> = {
  linear: {
    50: 95,
    100: 90,
    200: 80,
    300: 70,
    400: 60,
    500: 50,
    600: 40,
    700: 30,
    800: 20,
    900: 10,
    950: 5,
  },
  natural: {
    50: 96,
    100: 92,
    200: 85,
    300: 75,
    400: 65,
    500: 55,
    600: 45,
    700: 35,
    800: 25,
    900: 15,
    950: 10,
  },
  accessibility: {
    50: 97,
    100: 94,
    200: 88,
    300: 78,
    400: 68,
    500: 55,
    600: 42,
    700: 32,
    800: 22,
    900: 13,
    950: 8,
  },
};

/**
 * Calculate the lightness scale factor based on target shade
 */
function calculateLightnessScale(
  baseColor: string,
  targetShade: ShadeNumber,
  curveType: CurveType
): number {
  const hsl = tinycolor(baseColor).toHsl();
  const baseLightness = hsl.l * 100; // Convert to percentage
  const targetLightness = LIGHTNESS_CURVES[curveType][targetShade];
  return baseLightness / targetLightness;
}

/**
 * Generate a complete Tailwind palette from a base color
 */
export function generateTailwindPalette(
  baseColor: string,
  options: {
    name?: string;
    targetShade?: ShadeNumber;
    curveType?: CurveType;
  } = {}
): TailwindPalette {
  const {
    name = "primary",
    targetShade = 500,
    curveType = "natural",
  } = options;

  const color = tinycolor(baseColor);
  if (!color.isValid()) {
    throw new Error("Invalid color provided");
  }

  const normalizedHex = color.toHexString();
  const baseHsl = color.toHsl();

  // Calculate lightness scale to maintain base color at target shade
  const scale = calculateLightnessScale(normalizedHex, targetShade, curveType);

  const shades: PaletteShade[] = [];
  const shadeNumbers: ShadeNumber[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  shadeNumbers.forEach((shade) => {
    // Get target lightness for this shade from the curve
    let targetLightness = LIGHTNESS_CURVES[curveType][shade] * scale;

    // Clamp lightness between 0-100
    targetLightness = Math.max(0, Math.min(100, targetLightness));

    // Adjust saturation for very light and very dark shades for more natural appearance
    let adjustedSaturation = baseHsl.s;
    if (shade <= 100) {
      // Reduce saturation for very light shades
      adjustedSaturation = baseHsl.s * 0.6;
    } else if (shade >= 900) {
      // Reduce saturation for very dark shades
      adjustedSaturation = baseHsl.s * 0.8;
    }

    const hex = tinycolor({
      h: baseHsl.h,
      s: adjustedSaturation,
      l: targetLightness / 100, // Convert back to 0-1 range
    }).toHexString();

    const hslColor = tinycolor(hex).toHsl();

    // Calculate contrast ratios
    const contrastVsWhite = getContrastRatio(hex, "#ffffff");
    const contrastVsBlack = getContrastRatio(hex, "#000000");

    // Get WCAG compliance
    const complianceWhite = getWCAGCompliance(contrastVsWhite);
    const complianceBlack = getWCAGCompliance(contrastVsBlack);

    shades.push({
      shade,
      hex,
      hsl: {
        h: hslColor.h,
        s: hslColor.s * 100,
        l: hslColor.l * 100,
      },
      contrastVsWhite,
      contrastVsBlack,
      wcagWhite: {
        aa: complianceWhite.aa.normal,
        aaa: complianceWhite.aaa.normal,
      },
      wcagBlack: {
        aa: complianceBlack.aa.normal,
        aaa: complianceBlack.aaa.normal,
      },
    });
  });

  return {
    name,
    baseColor: normalizedHex,
    targetShade,
    curveType,
    shades,
  };
}

/**
 * Export palette as Tailwind config snippet
 */
export function exportAsTailwindConfig(palette: TailwindPalette): string {
  const shadeEntries = palette.shades
    .map((shade) => `          ${shade.shade}: '${shade.hex}',`)
    .join("\n");

  return `module.exports = {
  theme: {
    extend: {
      colors: {
        ${palette.name}: {
${shadeEntries}
        }
      }
    }
  }
}`;
}

/**
 * Export palette as CSS variables
 */
export function exportAsCSS(palette: TailwindPalette): string {
  const variables = palette.shades
    .map((shade) => `  --color-${palette.name}-${shade.shade}: ${shade.hex};`)
    .join("\n");

  return `:root {
${variables}
}`;
}

/**
 * Export palette as JSON
 */
export function exportAsJSON(palette: TailwindPalette): string {
  const colors: Record<string, string> = {};
  palette.shades.forEach((shade) => {
    colors[shade.shade.toString()] = shade.hex;
  });

  return JSON.stringify(
    {
      [palette.name]: colors,
    },
    null,
    2
  );
}

/**
 * Get contrast pairs (useful combinations of shades)
 */
export function getContrastPairs(palette: TailwindPalette): Array<{
  lightShade: ShadeNumber;
  darkShade: ShadeNumber;
  contrast: number;
  aa: boolean;
  aaa: boolean;
}> {
  const pairs: Array<{
    lightShade: ShadeNumber;
    darkShade: ShadeNumber;
    contrast: number;
    aa: boolean;
    aaa: boolean;
  }> = [];

  // Common useful pairs
  const pairings: Array<[ShadeNumber, ShadeNumber]> = [
    [50, 900],
    [50, 950],
    [100, 800],
    [100, 900],
    [200, 700],
    [200, 800],
    [300, 700],
  ];

  pairings.forEach(([light, dark]) => {
    const lightShade = palette.shades.find((s) => s.shade === light);
    const darkShade = palette.shades.find((s) => s.shade === dark);

    if (lightShade && darkShade) {
      const contrast = getContrastRatio(lightShade.hex, darkShade.hex);
      const compliance = getWCAGCompliance(contrast);

      pairs.push({
        lightShade: light,
        darkShade: dark,
        contrast,
        aa: compliance.aa.normal,
        aaa: compliance.aaa.normal,
      });
    }
  });

  return pairs;
}
