"use client";

import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ColorPair } from "@/lib/types";
import { getContrastRatio, getWCAGCompliance } from "@/lib/color-parser";

interface PairsTabProps {
  detectedColorPairs: ColorPair[];
  onBackgroundColorChange: (color: string) => void;
}

export function PairsTab({
  detectedColorPairs,
  onBackgroundColorChange,
}: PairsTabProps) {
  return (
    <div className="flex flex-col gap-6 h-full overflow-auto p-4">
      <div>
        <div className="flex items-center mb-3">
          <SectionHeader
            title="Detected Color Pairs"
            size="sm"
            className="mb-0"
          />
          <InfoTooltip content="These are foreground/background color combinations found in your CSS code (e.g., text color on a background). Each pair is tested for readability." />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Automatically detected foreground and background color combinations from your code
        </p>
      </div>

      {detectedColorPairs.length === 0 ? (
        <div className="p-8 text-center bg-card border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No color pairs detected in your code
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Color pairs are detected from CSS properties like background/color combinations
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {detectedColorPairs.map((pair, idx) => {
            const contrastRatio = getContrastRatio(pair.foreground, pair.background);
            const compliance = getWCAGCompliance(contrastRatio);

            return (
              <div
                key={idx}
                className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onBackgroundColorChange(pair.background)}
              >
                {/* Color Swatches */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded border-2"
                      style={{ backgroundColor: pair.foreground }}
                      title={`Foreground: ${pair.foreground}`}
                    />
                    <span className="text-sm text-muted-foreground">on</span>
                    <div
                      className="w-12 h-12 rounded border-2"
                      style={{ backgroundColor: pair.background }}
                      title={`Background: ${pair.background}`}
                    />
                  </div>
                </div>

                {/* Color Values */}
                <div className="space-y-1 mb-3">
                  <div className="text-xs font-mono">
                    <span className="text-muted-foreground">Foreground:</span>{" "}
                    {pair.foreground}
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-muted-foreground">Background:</span>{" "}
                    {pair.background}
                  </div>
                </div>

                {/* Contrast Info */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Contrast:</span>{" "}
                    <span className="font-mono font-semibold">
                      {contrastRatio.toFixed(2)}:1
                    </span>
                  </div>
                  <Badge
                    variant={compliance.aa.normal ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {compliance.aaa.normal ? "AAA" : compliance.aa.normal ? "AA" : "Fail"}
                  </Badge>
                </div>

                {/* WCAG Details */}
                <div className="mt-3 pt-3 border-t space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">AA Normal (4.5:1)</span>
                    <span className={compliance.aa.normal ? "text-green-600" : "text-red-600"}>
                      {compliance.aa.normal ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">AA Large (3:1)</span>
                    <span className={compliance.aa.large ? "text-green-600" : "text-red-600"}>
                      {compliance.aa.large ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">AAA Normal (7:1)</span>
                    <span className={compliance.aaa.normal ? "text-green-600" : "text-red-600"}>
                      {compliance.aaa.normal ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">AAA Large (4.5:1)</span>
                    <span className={compliance.aaa.large ? "text-green-600" : "text-red-600"}>
                      {compliance.aaa.large ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
