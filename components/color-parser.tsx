"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import tinycolor from "tinycolor2";
import { Copy, Check, Download, RefreshCw, Palette, CheckCircle, XCircle, AlertTriangle, Undo, Redo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  parseColors,
  getUniqueColors,
  replaceColor,
  getContrastRatio,
  getWCAGCompliance,
  suggestAccessibleAlternative,
  type ParsedColor,
} from "@/lib/color-parser";
import Header from "@/components/header";
import { HighlightedTextEditor } from "@/components/highlighted-text-editor";

const SAMPLE_TEXT = `/* Sample CSS with colors */
.header {
  background: #1a73e8;
  color: #ffffff;
  border: 1px solid rgb(200, 200, 200);
}

.button {
  background-color: #34a853;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alert {
  background: hsl(0, 70%, 50%);
  color: #fff;
}

.link {
  color: royalblue;
  text-decoration: none;
}`;

export default function ColorParser() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [originalText, setOriginalText] = useState(SAMPLE_TEXT);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [replacementColor, setReplacementColor] = useState<string>("");
  const [replacementMode, setReplacementMode] = useState<"all" | "selective">("all");
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [backgroundColorForContrast, setBackgroundColorForContrast] = useState<string>("#ffffff");
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false);

  // Undo/Redo history
  const [textHistory, setTextHistory] = useState<string[]>([SAMPLE_TEXT]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const MAX_HISTORY_SIZE = 50;

  // Debounce text input for auto-parsing
  const debouncedText = useDebounce(text, 300);

  // Parse colors whenever text changes
  const parsedColors = useMemo(() => {
    return parseColors(debouncedText);
  }, [debouncedText]);

  const uniqueColors = useMemo(() => {
    return getUniqueColors(parsedColors);
  }, [parsedColors]);

  // Smart detection of color pairs from CSS
  const detectedColorPairs = useMemo(() => {
    const pairs: { foreground: string; background: string; context: string }[] = [];

    // Parse CSS rules to find color/background pairs
    const cssRulePattern = /\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = cssRulePattern.exec(debouncedText)) !== null) {
      const ruleContent = match[1];

      // Look for color and background properties
      const colorMatch = ruleContent.match(/color\s*:\s*([^;]+)/i);
      const bgMatch = ruleContent.match(/background(?:-color)?\s*:\s*([^;]+)/i);

      if (colorMatch && bgMatch) {
        const foregroundValue = colorMatch[1].trim();
        const backgroundValue = bgMatch[1].trim();

        // Parse to get normalized hex values
        const fgParsed = parseColors(foregroundValue);
        const bgParsed = parseColors(backgroundValue);

        if (fgParsed.length > 0 && bgParsed.length > 0) {
          pairs.push({
            foreground: fgParsed[0].normalized,
            background: bgParsed[0].normalized,
            context: match[0].substring(0, 50) + "..."
          });
        }
      }
    }

    return pairs;
  }, [debouncedText]);

  // Original palette for before/after comparison
  const originalColors = useMemo(() => {
    return getUniqueColors(parseColors(originalText));
  }, [originalText]);

  // Get instances of selected color
  const selectedColorInstances = useMemo(() => {
    if (!selectedColor) return [];
    return parsedColors.filter(c => c.normalized === selectedColor);
  }, [parsedColors, selectedColor]);

  // Reset replacement when color selection changes
  useEffect(() => {
    if (selectedColor) {
      setReplacementColor(selectedColor);
      setSelectedInstances([]);
    }
  }, [selectedColor]);

  // Function to update text with history tracking
  const updateTextWithHistory = (newText: string) => {
    if (newText === text) return; // No change

    // Remove any "future" history if we're not at the end
    const newHistory = textHistory.slice(0, historyIndex + 1);

    // Add new text to history
    newHistory.push(newText);

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
      setTextHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      setTextHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    setText(newText);
  };

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setText(textHistory[newIndex]);
    }
  }, [historyIndex, textHistory]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < textHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setText(textHistory[newIndex]);
    }
  }, [historyIndex, textHistory]);

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < textHistory.length - 1;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey;

      // Undo: Cmd/Ctrl+Z (without Shift)
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Cmd/Ctrl+Shift+Z
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleReplace = () => {
    if (!selectedColor || !replacementColor) return;

    const newText = replaceColor(
      text,
      parsedColors,
      selectedColor,
      replacementColor,
      replacementMode,
      replacementMode === "selective" ? selectedInstances : undefined
    );

    updateTextWithHistory(newText);
    setSelectedColor(null);
    setReplacementColor("");
    setSelectedInstances([]);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hueshift-output.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setText(originalText);
    setSelectedColor(null);
  };

  const toggleInstance = (id: string) => {
    setSelectedInstances(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleApplySuggestion = (originalColor: string, suggestedColor: string) => {
    const newText = replaceColor(
      text,
      parsedColors,
      originalColor,
      suggestedColor,
      "all"
    );
    updateTextWithHistory(newText);
  };

  return (
    <>
      <Header />
      <div className="grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-80px)] p-4 md:p-6 bg-gray-50">
        {/* Left Panel: Text Editor */}
        <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Text Editor</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Paste your code or text containing colors
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex-1 sm:flex-none"
              title="Undo (Ctrl/Cmd+Z)"
            >
              <Undo className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex-1 sm:flex-none"
              title="Redo (Ctrl/Cmd+Shift+Z)"
            >
              <Redo className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Redo</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
              {copied ? (
                <Check className="w-4 h-4 sm:mr-2" />
              ) : (
                <Copy className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        <HighlightedTextEditor
          value={text}
          onChange={updateTextWithHistory}
          parsedColors={parsedColors}
          selectedColor={selectedColor}
          placeholder="Paste your CSS, HTML, SVG, or any text with colors..."
        />

        <div className="text-sm text-muted-foreground">
          {parsedColors.length} color{parsedColors.length !== 1 ? "s" : ""} detected
          ({uniqueColors.length} unique)
        </div>
      </div>

      {/* Right Panel: Color Gallery & Tools */}
      <div className="flex flex-col gap-4 overflow-auto">
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="comparison">Before/After</TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4">
            {/* Compact Background Selector */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border rounded-lg">
                <span className="text-sm font-medium whitespace-nowrap">Testing against:</span>
                <Input
                  value={backgroundColorForContrast}
                  onChange={e => setBackgroundColorForContrast(e.target.value)}
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
                  onClick={() => setBackgroundColorForContrast("#ffffff")}
                  className="text-xs h-8 px-2"
                >
                  White
                </Button>
                <Button
                  variant={backgroundColorForContrast === "#000000" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackgroundColorForContrast("#000000")}
                  className="text-xs h-8 px-2"
                >
                  Black
                </Button>
                <Button
                  variant={backgroundColorForContrast === "#f5f5f5" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackgroundColorForContrast("#f5f5f5")}
                  className="text-xs h-8 px-2"
                >
                  Light
                </Button>
                <Button
                  variant={backgroundColorForContrast === "#333333" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackgroundColorForContrast("#333333")}
                  className="text-xs h-8 px-2"
                >
                  Dark
                </Button>
                <div className="h-4 w-px bg-gray-300" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedPicker(!showAdvancedPicker)}
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
                      onChange={setBackgroundColorForContrast}
                      style={{ width: "200px", height: "200px" }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Detected Color Pairs (Smart Context Detection) - Collapsible */}
            {detectedColorPairs.length > 0 && (
              <details className="group">
                <summary className="flex items-center gap-2 p-3 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 list-none">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm font-medium">Detected Color Pairs</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {detectedColorPairs.length}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 p-3 bg-white border rounded-lg space-y-2">
                  {detectedColorPairs.map((pair, idx) => {
                    const contrastRatio = getContrastRatio(pair.foreground, pair.background);
                    const compliance = getWCAGCompliance(contrastRatio);

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => setBackgroundColorForContrast(pair.background)}
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

            <div>
              <h3 className="text-lg font-semibold mb-3">Detected Colors</h3>
              {uniqueColors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No colors detected. Try pasting some code with color values.
                </p>
              ) : (
                <TooltipProvider>
                  <div className="grid grid-cols-3 gap-3">
                    {uniqueColors.map(color => {
                      const contrastRatio = getContrastRatio(color.normalized, backgroundColorForContrast);
                      const compliance = getWCAGCompliance(contrastRatio);
                      const passesAA = compliance.aa.normal;
                      const passesAAA = compliance.aaa.normal;

                      return (
                        <Tooltip key={color.id}>
                          <TooltipTrigger asChild>
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedColor === color.normalized
                                  ? "ring-2 ring-blue-500"
                                  : ""
                              }`}
                              onClick={() => setSelectedColor(
                                selectedColor === color.normalized ? null : color.normalized
                              )}
                            >
                              <CardContent className="p-0 flex flex-col">
                                {/* Full-width color swatch */}
                                <div
                                  className="w-full h-24 rounded-t-md border-b border-gray-200"
                                  style={{ backgroundColor: color.normalized }}
                                />

                                {/* Content below */}
                                <div className="p-3 flex flex-col items-center">
                                  {/* WCAG Badge */}
                                  <div className="mb-2">
                                    {passesAAA ? (
                                      <Badge variant="default" className="bg-green-600 text-white text-[10px] px-1.5 py-0">
                                        AAA
                                      </Badge>
                                    ) : passesAA ? (
                                      <Badge variant="default" className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                                        AA
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                        Fail
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="w-full space-y-0.5">
                                    <span className="text-xs font-mono font-semibold block truncate text-center" title={color.normalized}>
                                      {color.normalized}
                                    </span>
                                    <span className="text-[10px] font-mono text-muted-foreground block truncate text-center" title={tinycolor(color.normalized).toRgbString()}>
                                      {tinycolor(color.normalized).toRgbString()}
                                    </span>
                                    <span className="text-[10px] font-mono text-muted-foreground block truncate text-center" title={tinycolor(color.normalized).toHslString()}>
                                      {tinycolor(color.normalized).toHslString()}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block truncate capitalize text-center" title={tinycolor(color.normalized).toName() || "no name"}>
                                      {tinycolor(color.normalized).toName() || "—"}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-1">
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
                                        handleApplySuggestion(color.normalized, suggestion.suggested);
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

            {/* Replacement Panel */}
            {selectedColor && (
              <Card className="border-2">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Replace Color</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedColor(null)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <HexColorPicker
                        color={replacementColor}
                        onChange={setReplacementColor}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-sm font-medium">Hex Value</label>
                        <Input
                          value={replacementColor}
                          onChange={e => setReplacementColor(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Replacement Mode
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant={replacementMode === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setReplacementMode("all")}
                            className="flex-1"
                          >
                            Replace All
                          </Button>
                          <Button
                            variant={replacementMode === "selective" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setReplacementMode("selective")}
                            className="flex-1"
                          >
                            Selective
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selective mode: show instances */}
                  {replacementMode === "selective" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select instances to replace:
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedColorInstances.map((instance, idx) => (
                          <div
                            key={instance.id}
                            className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleInstance(instance.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedInstances.includes(instance.id)}
                              onChange={() => toggleInstance(instance.id)}
                              className="w-4 h-4"
                            />
                            <span className="text-xs font-mono">
                              Instance {idx + 1}: {instance.original} (pos: {instance.startIndex})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button onClick={handleReplace} className="w-full">
                    Apply Replacement
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Before/After Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Palette Comparison</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Original Palette</h4>
                  <div className="flex flex-wrap gap-2">
                    {originalColors.map(color => (
                      <div key={color.id} className="text-center">
                        <div
                          className="w-12 h-12 rounded border"
                          style={{ backgroundColor: color.normalized }}
                          title={color.normalized}
                        />
                        <span className="text-xs font-mono block mt-1">
                          {color.normalized.substring(0, 7)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Current Palette</h4>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map(color => (
                      <div key={color.id} className="text-center">
                        <div
                          className="w-12 h-12 rounded border"
                          style={{ backgroundColor: color.normalized }}
                          title={color.normalized}
                        />
                        <span className="text-xs font-mono block mt-1">
                          {color.normalized.substring(0, 7)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
