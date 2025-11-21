"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  parseColors,
  getUniqueColors,
  replaceColor,
  type ParsedColor,
  type SimilarColorGroup,
  findSimilarColorGroups,
} from "@/lib/color-parser";
import Header from "@/components/header";
import { EditorPanel } from "@/components/editor-panel";
import { GalleryPanel } from "@/components/gallery-panel";
import { InspectorPanel } from "@/components/inspector-panel";

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
  // Text state
  const [text, setText] = useState(SAMPLE_TEXT);
  const [originalText, setOriginalText] = useState(SAMPLE_TEXT);

  // Color selection state
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [replacementColor, setReplacementColor] = useState<string>("");
  const [replacementMode, setReplacementMode] = useState<"all" | "selective">("all");
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);

  // UI state
  const [copied, setCopied] = useState(false);
  const [backgroundColorForContrast, setBackgroundColorForContrast] = useState<string>("#ffffff");
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(8);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Undo/Redo history
  const [textHistory, setTextHistory] = useState<string[]>([SAMPLE_TEXT]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const MAX_HISTORY_SIZE = 50;

  // Panel resizing state
  const [editorWidth, setEditorWidth] = useState(33); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce text input for auto-parsing
  const debouncedText = useDebounce(text, 300);

  // Parse colors whenever text changes
  const parsedColors = useMemo(() => {
    return parseColors(debouncedText);
  }, [debouncedText]);

  const uniqueColors = useMemo(() => {
    return getUniqueColors(parsedColors);
  }, [parsedColors]);

  // Find similar color groups
  const similarColorGroups = useMemo(() => {
    return findSimilarColorGroups(uniqueColors, similarityThreshold);
  }, [uniqueColors, similarityThreshold]);

  // Smart detection of color pairs from CSS
  const detectedColorPairs = useMemo(() => {
    const pairs: { foreground: string; background: string; context: string }[] = [];
    const cssRulePattern = /\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = cssRulePattern.exec(debouncedText)) !== null) {
      const ruleContent = match[1];
      const colorMatch = ruleContent.match(/color\s*:\s*([^;]+)/i);
      const bgMatch = ruleContent.match(/background(?:-color)?\s*:\s*([^;]+)/i);

      if (colorMatch && bgMatch) {
        const foregroundValue = colorMatch[1].trim();
        const backgroundValue = bgMatch[1].trim();
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
      setInspectorOpen(true);
    }
  }, [selectedColor]);

  // Function to update text with history tracking
  const updateTextWithHistory = (newText: string) => {
    if (newText === text) return;
    const newHistory = textHistory.slice(0, historyIndex + 1);
    newHistory.push(newText);

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
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
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

  const handleMergeSimilarColors = (group: SimilarColorGroup) => {
    let newText = text;
    group.similar.forEach(({ color }) => {
      newText = replaceColor(
        newText,
        parseColors(newText),
        color,
        group.representative,
        "all"
      );
    });
    updateTextWithHistory(newText);
  };

  // Handle panel resizing
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setEditorWidth(Math.max(20, Math.min(50, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Calculate panel widths
  const galleryWidth = selectedColor ? (100 - editorWidth - 25) : (100 - editorWidth);
  const inspectorWidth = 25;

  return (
    <>
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onCopy={handleCopy}
        onDownload={handleDownload}
        copied={copied}
      />

      {/* Desktop/Tablet Layout */}
      <div
        ref={containerRef}
        className="hidden md:flex h-[calc(100vh-80px)] bg-gray-50 overflow-hidden"
      >
        {/* Editor Panel */}
        <div
          style={{ width: `${editorWidth}%` }}
          className="flex flex-col p-4 overflow-hidden border-r"
        >
          <EditorPanel
            text={text}
            onTextChange={updateTextWithHistory}
            parsedColors={parsedColors}
            uniqueColors={uniqueColors}
            selectedColor={selectedColor}
          />
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />

        {/* Gallery + Tabs */}
        <div
          style={{ width: `${galleryWidth}%` }}
          className="flex flex-col overflow-hidden"
        >
          <Tabs defaultValue="gallery" className="flex flex-col h-full">
            <div className="p-4 pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="comparison">Before/After</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="gallery" className="h-full p-4 pt-4 m-0">
                <GalleryPanel
                  uniqueColors={uniqueColors}
                  parsedColors={parsedColors}
                  similarColorGroups={similarColorGroups}
                  detectedColorPairs={detectedColorPairs}
                  backgroundColorForContrast={backgroundColorForContrast}
                  showAdvancedPicker={showAdvancedPicker}
                  similarityThreshold={similarityThreshold}
                  selectedColor={selectedColor}
                  onColorSelect={setSelectedColor}
                  onBackgroundColorChange={setBackgroundColorForContrast}
                  onShowAdvancedPickerToggle={setShowAdvancedPicker}
                  onSimilarityThresholdChange={setSimilarityThreshold}
                  onMergeSimilarColors={handleMergeSimilarColors}
                  onApplySuggestion={handleApplySuggestion}
                />
              </TabsContent>

              <TabsContent value="comparison" className="h-full p-4 pt-4 m-0 overflow-auto">
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
            </div>
          </Tabs>
        </div>

        {/* Inspector Panel - Desktop (Collapsible) */}
        {selectedColor && (
          <>
            <div className="w-1 bg-gray-200" />
            <div
              style={{ width: `${inspectorWidth}%` }}
              className="flex flex-col overflow-hidden"
            >
              <InspectorPanel
                selectedColor={selectedColor}
                replacementColor={replacementColor}
                replacementMode={replacementMode}
                selectedInstances={selectedInstances}
                selectedColorInstances={selectedColorInstances}
                backgroundColorForContrast={backgroundColorForContrast}
                showAdvancedPicker={showAdvancedPicker}
                uniqueColors={uniqueColors}
                onColorDeselect={() => setSelectedColor(null)}
                onReplacementColorChange={setReplacementColor}
                onReplacementModeChange={setReplacementMode}
                onInstanceToggle={toggleInstance}
                onReplace={handleReplace}
                onBackgroundColorChange={setBackgroundColorForContrast}
                onShowAdvancedPickerToggle={setShowAdvancedPicker}
                onApplySuggestion={handleApplySuggestion}
              />
            </div>
          </>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-[calc(100vh-80px)] bg-gray-50">
        <Tabs defaultValue="editor" className="w-full">
          <div className="sticky top-0 bg-white z-10 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="comparison">Compare</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="editor" className="p-4 m-0">
            <EditorPanel
              text={text}
              onTextChange={updateTextWithHistory}
              parsedColors={parsedColors}
              uniqueColors={uniqueColors}
              selectedColor={selectedColor}
            />
          </TabsContent>

          <TabsContent value="gallery" className="p-4 m-0">
            <GalleryPanel
              uniqueColors={uniqueColors}
              parsedColors={parsedColors}
              similarColorGroups={similarColorGroups}
              detectedColorPairs={detectedColorPairs}
              backgroundColorForContrast={backgroundColorForContrast}
              showAdvancedPicker={showAdvancedPicker}
              similarityThreshold={similarityThreshold}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
              onBackgroundColorChange={setBackgroundColorForContrast}
              onShowAdvancedPickerToggle={setShowAdvancedPicker}
              onSimilarityThresholdChange={setSimilarityThreshold}
              onMergeSimilarColors={handleMergeSimilarColors}
              onApplySuggestion={handleApplySuggestion}
            />
          </TabsContent>

          <TabsContent value="comparison" className="p-4 m-0">
            <div>
              <h3 className="text-lg font-semibold mb-4">Palette Comparison</h3>
              <div className="space-y-6">
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

        {/* Mobile Inspector Drawer - Only show FAB and drawer on mobile */}
        {selectedColor && (
          <div className="md:hidden">
            <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
              <SheetTrigger asChild>
                <Button
                  className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
                  size="icon"
                >
                  <PanelRightOpen className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0">
                <InspectorPanel
                  selectedColor={selectedColor}
                  replacementColor={replacementColor}
                  replacementMode={replacementMode}
                  selectedInstances={selectedInstances}
                  selectedColorInstances={selectedColorInstances}
                  backgroundColorForContrast={backgroundColorForContrast}
                  showAdvancedPicker={showAdvancedPicker}
                  uniqueColors={uniqueColors}
                  onColorDeselect={() => {
                    setSelectedColor(null);
                    setInspectorOpen(false);
                  }}
                  onReplacementColorChange={setReplacementColor}
                  onReplacementModeChange={setReplacementMode}
                  onInstanceToggle={toggleInstance}
                  onReplace={handleReplace}
                  onBackgroundColorChange={setBackgroundColorForContrast}
                  onShowAdvancedPickerToggle={setShowAdvancedPicker}
                  onApplySuggestion={handleApplySuggestion}
                />
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </>
  );
}
