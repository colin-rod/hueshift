"use client";

import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
import { Palette, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GalleryPanelProps } from "@/lib/types";
import { getContrastRatio, getWCAGCompliance, suggestAccessibleAlternative } from "@/lib/color-parser";

export function GalleryPanel({
  uniqueColors,
  parsedColors,
  similarColorGroups,
  detectedColorPairs,
  backgroundColorForContrast,
  showAdvancedPicker,
  similarityThreshold,
  selectedColor,
  onColorSelect,
  onBackgroundColorChange,
  onShowAdvancedPickerToggle,
  onSimilarityThresholdChange,
  onMergeSimilarColors,
  onApplySuggestion,
}: GalleryPanelProps) {
  return (
    <div className="flex flex-col gap-6 h-full overflow-auto">
      {/* Compact Background Selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 p-3 md:p-4 bg-white border rounded-lg">
          <span className="text-sm font-medium whitespace-nowrap">Testing against:</span>
          <Input
            value={backgroundColorForContrast}
            onChange={e => onBackgroundColorChange(e.target.value)}
            className="font-mono text-xs w-24 h-8"
          />
          <div
            className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer"
            style={{ backgroundColor: backgroundColorForContrast }}
            title={backgroundColorForContrast}
          />
          <div className="h-4 w-px bg-gray-300" />
          <Button
            variant={backgroundColorForContrast === "#ffffff" ? "default" : "outline"}
            size="sm"
            onClick={() => onBackgroundColorChange("#ffffff")}
            className="text-xs h-8 px-2"
          >
            White
          </Button>
          <Button
            variant={backgroundColorForContrast === "#000000" ? "default" : "outline"}
            size="sm"
            onClick={() => onBackgroundColorChange("#000000")}
            className="text-xs h-8 px-2"
          >
            Black
          </Button>
          <Button
            variant={backgroundColorForContrast === "#f5f5f5" ? "default" : "outline"}
            size="sm"
            onClick={() => onBackgroundColorChange("#f5f5f5")}
            className="text-xs h-8 px-2"
          >
            Light
          </Button>
          <Button
            variant={backgroundColorForContrast === "#333333" ? "default" : "outline"}
            size="sm"
            onClick={() => onBackgroundColorChange("#333333")}
            className="text-xs h-8 px-2"
          >
            Dark
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShowAdvancedPickerToggle(!showAdvancedPicker)}
            className="text-xs h-8 px-2"
          >
            <Palette className="w-3 h-3 mr-1" />
            Picker {showAdvancedPicker ? "▲" : "▼"}
          </Button>
        </div>

        {/* Advanced Color Picker - Collapsible */}
        {showAdvancedPicker && (
          <Card>
            <CardContent className="p-4 flex justify-center">
              <HexColorPicker
                color={backgroundColorForContrast}
                onChange={onBackgroundColorChange}
                style={{ width: "200px", height: "200px" }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Similar Colors (Duplicate Finder) - Collapsible */}
      {similarColorGroups.length > 0 && (
        <details className="group" open>
          <summary className="flex items-center gap-2 p-3 md:p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 list-none">
            <span className="text-lg">🔍</span>
            <span className="text-sm font-medium">Similar Colors</span>
            <Badge variant="secondary" className="text-[10px]">
              {similarColorGroups.length} {similarColorGroups.length === 1 ? "group" : "groups"}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-2 space-y-2">
            {/* Sensitivity Slider */}
            <div className="p-3 md:p-4 bg-white border rounded-lg">
              <label className="text-xs font-medium mb-2 block">
                Sensitivity: {similarityThreshold.toFixed(1)} Delta-E
                <span className="ml-2 text-muted-foreground font-normal">
                  ({similarityThreshold < 5 ? "Very Strict" : similarityThreshold < 10 ? "Moderate" : "Relaxed"})
                </span>
              </label>
              <input
                type="range"
                min="3"
                max="15"
                step="0.5"
                value={similarityThreshold}
                onChange={(e) => onSimilarityThresholdChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Strict</span>
                <span>Relaxed</span>
              </div>
            </div>

            {/* Similar Color Groups */}
            {similarColorGroups.map((group, idx) => (
              <div key={idx} className="p-3 md:p-4 bg-white border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Group {idx + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.totalCount} total uses
                  </span>
                </div>

                <div className="space-y-1.5">
                  {/* Representative Color */}
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div
                      className="w-10 h-10 rounded border-2 border-blue-400"
                      style={{ backgroundColor: group.representative }}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-mono font-semibold">
                        {group.representative}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Representative • {uniqueColors.find(c => c.normalized === group.representative)?.count || 0} uses
                      </div>
                    </div>
                    <Badge variant="default" className="text-[10px] px-1.5">
                      Main
                    </Badge>
                  </div>

                  {/* Similar Colors */}
                  {group.similar.map((similar, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: similar.color }}
                      />
                      <div className="flex-1">
                        <div className="text-xs font-mono">
                          {similar.color}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Δ {similar.distance.toFixed(1)} • {similar.count} uses
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onMergeSimilarColors(group)}
                >
                  Merge All → {group.representative}
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Detected Color Pairs (Smart Context Detection) - Collapsible */}
      {detectedColorPairs.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 p-3 md:p-4 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 list-none">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-medium">Detected Color Pairs</span>
            <Badge variant="secondary" className="text-[10px]">
              {detectedColorPairs.length}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-2 p-3 md:p-4 bg-white border rounded-lg space-y-2">
            {detectedColorPairs.map((pair, idx) => {
              const contrastRatio = getContrastRatio(pair.foreground, pair.background);
              const compliance = getWCAGCompliance(contrastRatio);

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => onBackgroundColorChange(pair.background)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: pair.foreground }}
                      title={`Foreground: ${pair.foreground}`}
                    />
                    <span className="text-xs">on</span>
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: pair.background }}
                      title={`Background: ${pair.background}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono truncate">
                      {pair.foreground} on {pair.background}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Contrast: {contrastRatio.toFixed(2)}:1
                    </div>
                  </div>
                  <Badge
                    variant={compliance.aa.normal ? "default" : "destructive"}
                    className="text-[10px] px-1.5"
                  >
                    {compliance.aaa.normal ? "AAA" : compliance.aa.normal ? "AA" : "Fail"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </details>
      )}

      <div className="max-w-5xl mx-auto">
        <h3 className="text-lg font-semibold mb-3">Detected Colors</h3>
        {uniqueColors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No colors detected. Try pasting some code with color values.
          </p>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-3 gap-4">
              {uniqueColors.map(color => {
                const contrastRatio = getContrastRatio(color.normalized, backgroundColorForContrast);
                const compliance = getWCAGCompliance(contrastRatio);
                const passesAA = compliance.aa.normal;
                const passesAAA = compliance.aaa.normal;

                return (
                  <Tooltip key={color.id}>
                    <TooltipTrigger asChild>
                      <Card
                        className={`shadow cursor-pointer transition-all hover:shadow-lg ${
                          selectedColor === color.normalized
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                        onClick={() => onColorSelect(
                          selectedColor === color.normalized ? null : color.normalized
                        )}
                      >
                        <CardContent className="p-3 md:p-4 flex flex-col gap-3">
                          {/* Header: Hex Title + WCAG Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-mono font-semibold truncate" title={color.normalized}>
                              {color.normalized}
                            </span>
                            {passesAAA ? (
                              <Badge variant="default" className="bg-green-600 text-white text-[10px] px-1.5 py-0 flex-shrink-0">
                                AAA
                              </Badge>
                            ) : passesAA ? (
                              <Badge variant="default" className="bg-green-500 text-white text-[10px] px-1.5 py-0 flex-shrink-0">
                                AA
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                Fail
                              </Badge>
                            )}
                          </div>

                          {/* Color Swatch */}
                          <div
                            className="w-full h-24 rounded-md border border-gray-200"
                            style={{ backgroundColor: color.normalized }}
                          />

                          {/* Metadata Section */}
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground block truncate text-center w-full" title={tinycolor(color.normalized).toRgbString()}>
                              {tinycolor(color.normalized).toRgbString()}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground block truncate text-center w-full" title={tinycolor(color.normalized).toHslString()}>
                              {tinycolor(color.normalized).toHslString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate capitalize text-center w-full" title={tinycolor(color.normalized).toName() || "no name"}>
                              {tinycolor(color.normalized).toName() || "—"}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {color.format} • {color.count}x
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: backgroundColorForContrast }}
                          />
                          <p className="font-semibold">
                            Selected: {contrastRatio.toFixed(2)}:1
                          </p>
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1">
                            {compliance.aa.normal ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>AA Normal Text (4.5:1)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {compliance.aa.large ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>AA Large Text (3:1)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {compliance.aaa.normal ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>AAA Normal Text (7:1)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {compliance.aaa.large ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>AAA Large Text (4.5:1)</span>
                          </div>
                        </div>

                        {/* Accessible Alternative Suggestion */}
                        {!compliance.aa.normal && (() => {
                          const suggestion = suggestAccessibleAlternative(
                            color.normalized,
                            backgroundColorForContrast,
                            "AA"
                          );
                          return suggestion ? (
                            <div className="border-t pt-2 mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                              <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-blue-600" />
                                Suggested Alternative (AA):
                              </p>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded border-2"
                                    style={{ backgroundColor: suggestion.suggested }}
                                  />
                                  <span className="text-xs font-mono">{suggestion.suggested}</span>
                                </div>
                                <Badge variant="default" className="bg-green-500 text-white text-[8px] px-1 py-0">
                                  {suggestion.ratio.toFixed(2)}:1
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                className="w-full h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApplySuggestion(color.normalized, suggestion.suggested);
                                }}
                              >
                                Use This Color
                              </Button>
                            </div>
                          ) : null;
                        })()}

                        <div className="border-t pt-2 mt-2">
                          <p className="text-xs font-semibold mb-1">Other Backgrounds:</p>
                          <div className="space-y-1">
                            {[
                              { bg: "#ffffff", label: "White" },
                              { bg: "#000000", label: "Black" },
                              { bg: "#f5f5f5", label: "Light Gray" },
                              { bg: "#333333", label: "Dark Gray" },
                            ]
                              .filter(item => item.bg !== backgroundColorForContrast)
                              .map(item => {
                                const otherContrast = getContrastRatio(color.normalized, item.bg);
                                const otherCompliance = getWCAGCompliance(otherContrast);
                                return (
                                  <div key={item.bg} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="w-3 h-3 rounded border"
                                        style={{ backgroundColor: item.bg }}
                                      />
                                      <span>{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono">{otherContrast.toFixed(2)}:1</span>
                                      {otherCompliance.aaa.normal ? (
                                        <Badge variant="default" className="bg-green-600 text-white text-[8px] px-1 py-0">AAA</Badge>
                                      ) : otherCompliance.aa.normal ? (
                                        <Badge variant="default" className="bg-green-500 text-white text-[8px] px-1 py-0">AA</Badge>
                                      ) : (
                                        <Badge variant="destructive" className="text-[8px] px-1 py-0">Fail</Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
