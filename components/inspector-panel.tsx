"use client";

import { useState } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
import { Palette, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { InspectorPanelProps } from "@/lib/types";
import { getContrastRatio, getWCAGCompliance, suggestAccessibleAlternative } from "@/lib/color-parser";

export function InspectorPanel({
  selectedColor,
  replacementColor,
  replacementMode,
  selectedInstances,
  selectedColorInstances,
  backgroundColorForContrast,
  showAdvancedPicker,
  uniqueColors,
  onColorDeselect,
  onReplacementColorChange,
  onReplacementModeChange,
  onInstanceToggle,
  onReplace,
  onBackgroundColorChange,
  onShowAdvancedPickerToggle,
  onApplySuggestion,
}: InspectorPanelProps) {
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);

  if (!selectedColor) {
    return null;
  }

  const colorInfo = uniqueColors.find(c => c.normalized === selectedColor);
  const contrastRatio = getContrastRatio(selectedColor, backgroundColorForContrast);
  const compliance = getWCAGCompliance(contrastRatio);
  const suggestion = !compliance.aa.normal
    ? suggestAccessibleAlternative(selectedColor, backgroundColorForContrast, "AA")
    : null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto p-4 bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Inspector" size="sm" className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onColorDeselect}
        >
          ✕
        </Button>
      </div>

      {/* Color Details Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded border-2"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="flex-1">
              <div className="text-sm font-mono font-semibold mb-1">{selectedColor}</div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{tinycolor(selectedColor).toRgbString()}</div>
                <div>{tinycolor(selectedColor).toHslString()}</div>
                {tinycolor(selectedColor).toName() && (
                  <div className="capitalize">{tinycolor(selectedColor).toName()}</div>
                )}
              </div>
            </div>
          </div>

          {colorInfo && (
            <div className="flex items-center justify-between text-xs border-t pt-2">
              <span className="text-muted-foreground">Format:</span>
              <Badge variant="secondary" className="text-xs">{colorInfo.format}</Badge>
            </div>
          )}

          {colorInfo && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Usage:</span>
              <span className="font-mono">{colorInfo.count}x</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contrast & Accessibility */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center">
            <h4 className="text-sm font-semibold">Accessibility</h4>
            <InfoTooltip content="Check how readable your color is when placed on different backgrounds. WCAG standards ensure text is readable for people with visual impairments." />
          </div>

          {/* Background Color Selector */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="text-xs font-medium">Testing Background:</label>
              <InfoTooltip content="Select a background color to test how well your selected color contrasts against it. This is important for text readability." />
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={backgroundColorForContrast}
                onChange={e => onBackgroundColorChange(e.target.value)}
                className="font-mono text-xs h-8 flex-1"
              />
              <div className="relative">
                <div
                  className="w-8 h-8 rounded border-2 border-gray-300 flex-shrink-0 cursor-pointer hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: backgroundColorForContrast }}
                  onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                  title="Click to open color picker"
                />
                {showBackgroundPicker && (
                  <div className="absolute right-0 top-10 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border">
                    <HexColorPicker
                      color={backgroundColorForContrast}
                      onChange={onBackgroundColorChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBackgroundPicker(false)}
                      className="w-full mt-2 text-xs"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { color: "#ffffff", label: "White" },
                { color: "#000000", label: "Black" },
                { color: "#f5f5f5", label: "Light Gray" },
                { color: "#333333", label: "Dark Gray" }
              ].map(({ color, label }) => (
                <Button
                  key={color}
                  variant={backgroundColorForContrast === color ? "default" : "outline"}
                  size="sm"
                  onClick={() => onBackgroundColorChange(color)}
                  className="text-xs h-8 px-2 flex gap-1.5 items-center justify-start"
                >
                  <div
                    className="w-3 h-3 rounded border flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Contrast Ratio */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-xs font-medium">Contrast Ratio:</span>
                <InfoTooltip content="A measure of how much the color differs from the background. Higher ratios mean better readability. Minimum 4.5:1 recommended for normal text." />
              </div>
              <span className="text-sm font-mono font-semibold">{contrastRatio.toFixed(2)}:1</span>
            </div>

            {/* WCAG Compliance */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {compliance.aa.normal ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span>AA Normal (4.5:1)</span>
                </div>
                <Badge
                  variant={compliance.aa.normal ? "default" : "destructive"}
                  className="text-[10px] px-1.5"
                >
                  {compliance.aa.normal ? "Pass" : "Fail"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {compliance.aa.large ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span>AA Large (3:1)</span>
                </div>
                <Badge
                  variant={compliance.aa.large ? "default" : "destructive"}
                  className="text-[10px] px-1.5"
                >
                  {compliance.aa.large ? "Pass" : "Fail"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {compliance.aaa.normal ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span>AAA Normal (7:1)</span>
                </div>
                <Badge
                  variant={compliance.aaa.normal ? "default" : "destructive"}
                  className="text-[10px] px-1.5"
                >
                  {compliance.aaa.normal ? "Pass" : "Fail"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {compliance.aaa.large ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span>AAA Large (4.5:1)</span>
                </div>
                <Badge
                  variant={compliance.aaa.large ? "default" : "destructive"}
                  className="text-[10px] px-1.5"
                >
                  {compliance.aaa.large ? "Pass" : "Fail"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Suggestion */}
          {suggestion && (
            <div className="border-t pt-3 bg-blue-50 p-3 rounded">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-blue-600" />
                Suggested Alternative:
              </p>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded border-2"
                  style={{ backgroundColor: suggestion.suggested }}
                />
                <div className="flex-1">
                  <div className="text-xs font-mono font-semibold">{suggestion.suggested}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {suggestion.ratio.toFixed(2)}:1 contrast
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => onApplySuggestion(selectedColor, suggestion.suggested)}
              >
                Apply Suggestion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Color Picker Section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center">
            <h4 className="text-sm font-semibold">Replace Color</h4>
            <InfoTooltip content="Choose a new color to replace the selected color in your text. You can pick from a visual color picker or enter a hex code directly." />
          </div>

          {/* Advanced Picker Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Color Picker:</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowAdvancedPickerToggle(!showAdvancedPicker)}
              className="text-xs h-7 px-2"
            >
              <Palette className="w-3 h-3 mr-1" />
              {showAdvancedPicker ? "Hide" : "Show"}
            </Button>
          </div>

          {/* Color Picker */}
          {showAdvancedPicker && (
            <div className="flex justify-center">
              <HexColorPicker
                color={replacementColor}
                onChange={onReplacementColorChange}
                style={{ width: "100%", maxWidth: "200px" }}
              />
            </div>
          )}

          {/* Hex Input */}
          <div>
            <label className="text-xs font-medium mb-1 block">Hex Value:</label>
            <Input
              value={replacementColor}
              onChange={e => onReplacementColorChange(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Replacement Mode */}
          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-medium">Mode:</label>
              <InfoTooltip content="Choose whether to replace all occurrences of the color at once, or select specific instances to replace individually." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="replacement-mode"
                  value="all"
                  checked={replacementMode === "all"}
                  onChange={() => onReplacementModeChange("all")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Replace all instances</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="replacement-mode"
                  value="selective"
                  checked={replacementMode === "selective"}
                  onChange={() => onReplacementModeChange("selective")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Select specific instances</span>
              </label>
            </div>
          </div>

          {/* Selective mode: show instances */}
          {replacementMode === "selective" && (
            <div>
              <label className="text-xs font-medium mb-2 block">
                Instances ({selectedColorInstances.length}):
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedColorInstances.map((instance, idx) => (
                  <div
                    key={instance.id}
                    className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 text-xs"
                    onClick={() => onInstanceToggle(instance.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstances.includes(instance.id)}
                      onChange={() => onInstanceToggle(instance.id)}
                      className="w-3 h-3"
                    />
                    <span className="font-mono truncate flex-1">
                      #{idx + 1}: {instance.original}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <Button onClick={onReplace} className="w-full" size="sm">
            Apply Replacement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
