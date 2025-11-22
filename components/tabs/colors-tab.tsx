"use client";

import { useRef } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
import { Palette, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SectionHeader } from "@/components/ui/section-header";
import { getContrastRatio, getWCAGCompliance, suggestAccessibleAlternative } from "@/lib/color-parser";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ParsedColor } from "@/lib/types";

interface ColorsTabProps {
  uniqueColors: ParsedColor[];
  backgroundColorForContrast: string;
  showAdvancedPicker: boolean;
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
  onBackgroundColorChange: (color: string) => void;
  onShowAdvancedPickerToggle: (show: boolean) => void;
  onApplySuggestion: (original: string, suggested: string) => void;
}

export function ColorsTab({
  uniqueColors,
  backgroundColorForContrast,
  showAdvancedPicker,
  selectedColor,
  onColorSelect,
  onBackgroundColorChange,
  onShowAdvancedPickerToggle,
  onApplySuggestion,
}: ColorsTabProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate rows for 3-column grid
  const COLUMNS = 3;
  const rowCount = Math.ceil(uniqueColors.length / COLUMNS);

  // Set up virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280,
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Compact Background Selector - Fixed at top */}
      <div className="flex-shrink-0 p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2 p-3 md:p-4 bg-card border rounded-lg">
          <span className="text-sm font-medium whitespace-nowrap">Testing against:</span>
          <Input
            value={backgroundColorForContrast}
            onChange={e => onBackgroundColorChange(e.target.value)}
            className="font-mono text-xs w-24 h-8"
          />
          <div
            className="w-6 h-6 rounded border-2 border-border cursor-pointer"
            style={{ backgroundColor: backgroundColorForContrast }}
            title={backgroundColorForContrast}
          />
          <div className="h-4 w-px bg-border" />
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
          <div className="h-4 w-px bg-border" />
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

      {/* Scrollable color grid */}
      <div ref={parentRef} className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto">
        <SectionHeader title="Detected Colors" size="sm" className="mb-3" />
        {uniqueColors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No colors detected. Try pasting some code with color values.
          </p>
        ) : (
          <TooltipProvider>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIdx = virtualRow.index * COLUMNS;
                const rowColors = uniqueColors.slice(startIdx, startIdx + COLUMNS);

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {rowColors.map(color => {
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
                                    className="w-full h-24 rounded-md border"
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
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
        )}
        </div>
      </div>
    </div>
  );
}
