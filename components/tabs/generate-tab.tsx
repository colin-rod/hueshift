"use client";

import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Copy, Check, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SectionHeader } from "@/components/ui/section-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  generateTailwindPalette,
  exportAsTailwindConfig,
  exportAsCSS,
  exportAsJSON,
  getContrastPairs,
  type TailwindPalette,
  type CurveType,
  type ShadeNumber,
} from "@/lib/palette-generator";

interface GenerateTabProps {
  initialColor?: string;
}

export function GenerateTab({ initialColor = "#3b82f6" }: GenerateTabProps) {
  const [paletteBaseColor, setPaletteBaseColor] = useState<string>(initialColor);
  const [paletteName, setPaletteName] = useState<string>("primary");
  const [paletteTargetShade, setPaletteTargetShade] = useState<ShadeNumber>(500);
  const [paletteCurveType, setPaletteCurveType] = useState<CurveType>("natural");
  const [generatedPalette, setGeneratedPalette] = useState<TailwindPalette | null>(null);
  const [paletteExportFormat, setPaletteExportFormat] = useState<"tailwind" | "css" | "json">("tailwind");
  const [paletteCopied, setPaletteCopied] = useState(false);

  // Update base color when initialColor prop changes
  useEffect(() => {
    if (initialColor && initialColor !== paletteBaseColor) {
      setPaletteBaseColor(initialColor);
    }
  }, [initialColor]);

  // Generate palette when inputs change
  useEffect(() => {
    try {
      const palette = generateTailwindPalette(paletteBaseColor, {
        name: paletteName,
        targetShade: paletteTargetShade,
        curveType: paletteCurveType,
      });
      setGeneratedPalette(palette);
    } catch (error) {
      console.error("Error generating palette:", error);
      setGeneratedPalette(null);
    }
  }, [paletteBaseColor, paletteName, paletteTargetShade, paletteCurveType]);

  const handleCopyPaletteExport = async () => {
    if (!generatedPalette) return;

    let exportText = "";
    if (paletteExportFormat === "tailwind") {
      exportText = exportAsTailwindConfig(generatedPalette);
    } else if (paletteExportFormat === "css") {
      exportText = exportAsCSS(generatedPalette);
    } else {
      exportText = exportAsJSON(generatedPalette);
    }

    await navigator.clipboard.writeText(exportText);
    setPaletteCopied(true);
    setTimeout(() => setPaletteCopied(false), 2000);
  };

  const handleDownloadPaletteExport = () => {
    if (!generatedPalette) return;

    let exportText = "";
    let filename = "";
    let mimeType = "text/plain";

    if (paletteExportFormat === "tailwind") {
      exportText = exportAsTailwindConfig(generatedPalette);
      filename = "tailwind.config.js";
      mimeType = "text/javascript";
    } else if (paletteExportFormat === "css") {
      exportText = exportAsCSS(generatedPalette);
      filename = `${generatedPalette.name}.css`;
      mimeType = "text/css";
    } else {
      exportText = exportAsJSON(generatedPalette);
      filename = `${generatedPalette.name}.json`;
      mimeType = "application/json";
    }

    const blob = new Blob([exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <SectionHeader
            title="Tailwind Palette Generator"
            size="sm"
            className="mb-2"
          />
          <p className="text-sm text-muted-foreground">
            Generate accessible, visually consistent color palettes using HSLuv color space
          </p>
        </div>

        {/* Input Controls */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <label className="text-sm font-medium">Base Color</label>
                  <InfoTooltip content="Choose your starting color. The palette generator will create lighter and darker variations of this color." />
                </div>
                <div className="flex gap-4">
                  <Input
                    value={paletteBaseColor}
                    onChange={(e) => setPaletteBaseColor(e.target.value)}
                    className="font-mono flex-1"
                    placeholder="#3b82f6"
                  />
                  <HexColorPicker
                    color={paletteBaseColor}
                    onChange={setPaletteBaseColor}
                    style={{ width: "120px", height: "120px" }}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Palette Name</label>
                  <Input
                    value={paletteName}
                    onChange={(e) => setPaletteName(e.target.value)}
                    placeholder="primary"
                  />
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <label className="text-sm font-medium">Target Shade</label>
                    <InfoTooltip content="Which shade (400, 500, or 600) should match your base color. Other shades will be lighter or darker. 500 is standard for most Tailwind palettes." />
                  </div>
                  <select
                    value={paletteTargetShade}
                    onChange={(e) => setPaletteTargetShade(Number(e.target.value) as ShadeNumber)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Which shade should match your base color
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Curve Type</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={paletteCurveType === "linear" ? "default" : "outline"}
                  onClick={() => setPaletteCurveType("linear")}
                  className="h-auto py-3 flex-col"
                >
                  <span className="font-semibold">Linear</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Evenly spaced lightness
                  </span>
                </Button>
                <Button
                  variant={paletteCurveType === "natural" ? "default" : "outline"}
                  onClick={() => setPaletteCurveType("natural")}
                  className="h-auto py-3 flex-col"
                >
                  <span className="font-semibold">Natural</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Perceptually balanced
                  </span>
                </Button>
                <Button
                  variant={paletteCurveType === "accessibility" ? "default" : "outline"}
                  onClick={() => setPaletteCurveType("accessibility")}
                  className="h-auto py-3 flex-col"
                >
                  <span className="font-semibold">Accessibility</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Optimized for WCAG
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Palette Preview */}
        {generatedPalette && (
          <>
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Generated Palette" size="sm" className="mb-4" />
                <div className="grid grid-cols-11 gap-2">
                  {generatedPalette.shades.map((shade) => (
                    <TooltipProvider key={shade.shade}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className="w-full aspect-square rounded-lg border-2 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                              style={{ backgroundColor: shade.hex }}
                              title={shade.hex}
                            />
                            <span className="text-xs font-medium">{shade.shade}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <div className="font-mono font-semibold">{shade.hex}</div>
                            <div className="text-[10px] text-muted-foreground">
                              vs White: {shade.contrastVsWhite.toFixed(2)}:1
                              {shade.wcagWhite.aaa ? " (AAA)" : shade.wcagWhite.aa ? " (AA)" : " (Fail)"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              vs Black: {shade.contrastVsBlack.toFixed(2)}:1
                              {shade.wcagBlack.aaa ? " (AAA)" : shade.wcagBlack.aa ? " (AA)" : " (Fail)"}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contrast Validation Matrix */}
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Contrast Validation" size="sm" className="mb-4" />
                <div className="grid md:grid-cols-2 gap-2">
                  {getContrastPairs(generatedPalette).map((pair, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm p-3 bg-secondary rounded-lg"
                    >
                      <span className="font-mono">
                        {pair.lightShade} on {pair.darkShade}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{pair.contrast.toFixed(2)}:1</span>
                        <Badge
                          variant={pair.aaa ? "default" : pair.aa ? "default" : "destructive"}
                          className={`text-[10px] px-2 ${
                            pair.aaa ? "bg-green-600" : pair.aa ? "bg-green-500" : ""
                          }`}
                        >
                          {pair.aaa ? "AAA" : pair.aa ? "AA" : "Fail"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <SectionHeader title="Export Palette" size="sm" />

                <div>
                  <label className="text-sm font-medium mb-3 block">Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={paletteExportFormat === "tailwind" ? "default" : "outline"}
                      onClick={() => setPaletteExportFormat("tailwind")}
                    >
                      Tailwind Config
                    </Button>
                    <Button
                      variant={paletteExportFormat === "css" ? "default" : "outline"}
                      onClick={() => setPaletteExportFormat("css")}
                    >
                      CSS Variables
                    </Button>
                    <Button
                      variant={paletteExportFormat === "json" ? "default" : "outline"}
                      onClick={() => setPaletteExportFormat("json")}
                    >
                      JSON
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCopyPaletteExport} className="flex-1" size="lg">
                    {paletteCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleDownloadPaletteExport} className="flex-1" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
