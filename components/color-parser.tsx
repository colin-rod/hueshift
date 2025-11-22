"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { InspectorPanel } from "@/components/inspector-panel";
import { TabNavigation, type TabType } from "@/components/ui/tab-navigation";
import { EditorToggle } from "@/components/ui/editor-toggle";
import { ColorsTab } from "@/components/tabs/colors-tab";
import { DuplicatesTab } from "@/components/tabs/duplicates-tab";
import { PairsTab } from "@/components/tabs/pairs-tab";
import { CompareTab } from "@/components/tabs/compare-tab";
import { GenerateTab } from "@/components/tabs/generate-tab";
import { ExportTab } from "@/components/tabs/export-tab";

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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state (with URL sync)
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams?.get("tab");
    return (tabParam as TabType) || "colors";
  });

  // Editor visibility state (with localStorage)
  const [editorVisible, setEditorVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hueshift-editor-visible");
      return stored !== null ? stored === "true" : true; // default to true
    }
    return true;
  });

  // Editor lock state (with localStorage)
  const [editorLocked, setEditorLocked] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hueshift-editor-locked");
      return stored === "true";
    }
    return false;
  });

  // Text state
  const [text, setText] = useState(SAMPLE_TEXT);
  const [originalText, setOriginalText] = useState(SAMPLE_TEXT);

  // Color selection state
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [replacementColor, setReplacementColor] = useState<string>("");
  const [replacementMode, setReplacementMode] = useState<"all" | "selective">("all");
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);

  // UI state
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

  // Sync tab changes with URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });

    // Auto-hide editor on non-colors tabs ONLY if not locked
    if (tab !== "colors" && editorVisible && !editorLocked) {
      setEditorVisible(false);
    }

    // Auto-show editor on colors tab if it was hidden (and not locked to hidden)
    if (tab === "colors" && !editorVisible && !editorLocked) {
      setEditorVisible(true);
    }
  };

  // Toggle editor visibility
  const handleEditorToggle = () => {
    const newVisible = !editorVisible;
    setEditorVisible(newVisible);
    localStorage.setItem("hueshift-editor-visible", String(newVisible));
  };

  // Toggle editor lock
  const handleEditorLockToggle = () => {
    const newLocked = !editorLocked;
    setEditorLocked(newLocked);
    localStorage.setItem("hueshift-editor-locked", String(newLocked));
  };

  // Update editor visibility based on active tab (only on initial tab load)
  useEffect(() => {
    // Only auto-adjust editor visibility if not locked
    if (!editorLocked) {
      setEditorVisible(activeTab === "colors");
    }
  }, []); // Only run once on mount

  // Calculate panel widths based on editor visibility
  const calculatePanelWidths = () => {
    const baseEditorWidth = editorVisible ? editorWidth : 0;
    const inspectorWidth = selectedColor ? 25 : 0;
    const galleryWidth = 100 - baseEditorWidth - inspectorWidth;
    return { editorWidth: baseEditorWidth, galleryWidth, inspectorWidth };
  };

  const panelWidths = calculatePanelWidths();

  return (
    <>
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
      >
        {/* Tab Navigation and Editor Toggle */}
        <div className="flex items-center gap-3 flex-1 max-w-6xl mx-auto px-4">
          <EditorToggle
            isVisible={editorVisible}
            isLocked={editorLocked}
            onToggle={handleEditorToggle}
            onLockToggle={handleEditorLockToggle}
          />
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            duplicatesCount={similarColorGroups.length}
            pairsCount={detectedColorPairs.length}
          />
        </div>
      </Header>

      {/* Desktop/Tablet Layout */}
      <div
        ref={containerRef}
        className="hidden md:flex h-[calc(100vh-80px)] bg-muted overflow-hidden"
      >
        {/* Editor Panel - with smooth slide animation */}
        <div
          style={{
            width: editorVisible ? `${editorWidth}%` : "0%",
            transition: "width 0.3s ease-in-out",
          }}
          className="flex flex-col overflow-hidden border-r"
        >
          {editorVisible && (
            <div className="p-4 h-full overflow-hidden">
              <EditorPanel
                text={text}
                onTextChange={updateTextWithHistory}
                parsedColors={parsedColors}
                uniqueColors={uniqueColors}
                selectedColor={selectedColor}
              />
            </div>
          )}
        </div>

        {/* Resizable Divider - only show when editor is visible */}
        {editorVisible && (
          <div
            className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Main Content Area - Tab Content */}
        <div
          style={{
            width: `${panelWidths.galleryWidth}%`,
            transition: "width 0.3s ease-in-out",
          }}
          className="flex flex-col overflow-hidden"
        >
          {activeTab === "colors" && (
            <ColorsTab
              uniqueColors={uniqueColors}
              backgroundColorForContrast={backgroundColorForContrast}
              showAdvancedPicker={showAdvancedPicker}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
              onBackgroundColorChange={setBackgroundColorForContrast}
              onShowAdvancedPickerToggle={setShowAdvancedPicker}
              onApplySuggestion={handleApplySuggestion}
            />
          )}

          {activeTab === "duplicates" && (
            <DuplicatesTab
              similarColorGroups={similarColorGroups}
              uniqueColors={uniqueColors}
              similarityThreshold={similarityThreshold}
              onSimilarityThresholdChange={setSimilarityThreshold}
              onMergeSimilarColors={handleMergeSimilarColors}
            />
          )}

          {activeTab === "pairs" && (
            <PairsTab
              detectedColorPairs={detectedColorPairs}
              onBackgroundColorChange={setBackgroundColorForContrast}
            />
          )}

          {activeTab === "compare" && (
            <CompareTab
              originalColors={originalColors}
              currentColors={uniqueColors}
              originalText={originalText}
              currentText={text}
            />
          )}

          {activeTab === "generate" && (
            <GenerateTab initialColor={selectedColor || undefined} />
          )}

          {activeTab === "export" && (
            <ExportTab
              originalText={originalText}
              currentText={text}
            />
          )}
        </div>

        {/* Inspector Panel - Desktop (Collapsible) */}
        {selectedColor && (
          <>
            <div className="w-1 bg-border" />
            <div
              style={{
                width: `${panelWidths.inspectorWidth}%`,
                transition: "width 0.3s ease-in-out",
              }}
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
      <div className="md:hidden min-h-[calc(100vh-80px)] bg-muted">
        {/* Mobile content based on active tab */}
        <div className="min-h-[calc(100vh-140px)]">
          {activeTab === "colors" && (
            <ColorsTab
              uniqueColors={uniqueColors}
              backgroundColorForContrast={backgroundColorForContrast}
              showAdvancedPicker={showAdvancedPicker}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
              onBackgroundColorChange={setBackgroundColorForContrast}
              onShowAdvancedPickerToggle={setShowAdvancedPicker}
              onApplySuggestion={handleApplySuggestion}
            />
          )}

          {activeTab === "duplicates" && (
            <DuplicatesTab
              similarColorGroups={similarColorGroups}
              uniqueColors={uniqueColors}
              similarityThreshold={similarityThreshold}
              onSimilarityThresholdChange={setSimilarityThreshold}
              onMergeSimilarColors={handleMergeSimilarColors}
            />
          )}

          {activeTab === "pairs" && (
            <PairsTab
              detectedColorPairs={detectedColorPairs}
              onBackgroundColorChange={setBackgroundColorForContrast}
            />
          )}

          {activeTab === "compare" && (
            <CompareTab
              originalColors={originalColors}
              currentColors={uniqueColors}
              originalText={originalText}
              currentText={text}
            />
          )}

          {activeTab === "generate" && (
            <GenerateTab initialColor={selectedColor || undefined} />
          )}

          {activeTab === "export" && (
            <ExportTab
              originalText={originalText}
              currentText={text}
            />
          )}
        </div>

        {/* Mobile Editor Drawer - show when editor toggle is on */}
        {editorVisible && (
          <Sheet open={editorVisible} onOpenChange={(open) => !open && handleEditorToggle()}>
            <SheetContent side="left" className="w-[90vw] sm:w-[400px] p-0">
              <div className="p-4 h-full overflow-hidden">
                <EditorPanel
                  text={text}
                  onTextChange={updateTextWithHistory}
                  parsedColors={parsedColors}
                  uniqueColors={uniqueColors}
                  selectedColor={selectedColor}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}

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
