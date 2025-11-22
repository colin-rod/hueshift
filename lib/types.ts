import { ParsedColor, SimilarColorGroup } from "./color-parser";
import { TailwindPalette, CurveType, ShadeNumber } from "./palette-generator";

// Re-export commonly used types
export type { ParsedColor, SimilarColorGroup };
export type { TailwindPalette, CurveType, ShadeNumber };

// Color Pair type
export interface ColorPair {
  foreground: string;
  background: string;
  context: string;
}

// Editor Panel Props
export interface EditorPanelProps {
  text: string;
  onTextChange: (newText: string) => void;
  parsedColors: ParsedColor[];
  uniqueColors: ParsedColor[];
  selectedColor: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}

// Gallery Panel Props
export interface GalleryPanelProps {
  uniqueColors: ParsedColor[];
  parsedColors: ParsedColor[];
  similarColorGroups: SimilarColorGroup[];
  detectedColorPairs: Array<{ foreground: string; background: string; context: string }>;
  backgroundColorForContrast: string;
  showAdvancedPicker: boolean;
  similarityThreshold: number;
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
  onBackgroundColorChange: (color: string) => void;
  onShowAdvancedPickerToggle: (show: boolean) => void;
  onSimilarityThresholdChange: (threshold: number) => void;
  onMergeSimilarColors: (group: SimilarColorGroup) => void;
  onApplySuggestion: (originalColor: string, suggestedColor: string) => void;
}

// Inspector Panel Props
export interface InspectorPanelProps {
  selectedColor: string | null;
  replacementColor: string;
  replacementMode: "all" | "selective";
  selectedInstances: string[];
  selectedColorInstances: ParsedColor[];
  backgroundColorForContrast: string;
  showAdvancedPicker: boolean;
  uniqueColors: ParsedColor[];
  onColorDeselect: () => void;
  onReplacementColorChange: (color: string) => void;
  onReplacementModeChange: (mode: "all" | "selective") => void;
  onInstanceToggle: (id: string) => void;
  onReplace: () => void;
  onBackgroundColorChange: (color: string) => void;
  onShowAdvancedPickerToggle: (show: boolean) => void;
  onApplySuggestion: (originalColor: string, suggestedColor: string) => void;
}

// Palette Generator Page Props
export interface PaletteGeneratorPageProps {
  paletteBaseColor: string;
  paletteName: string;
  paletteTargetShade: ShadeNumber;
  paletteCurveType: CurveType;
  generatedPalette: TailwindPalette | null;
  paletteExportFormat: "tailwind" | "css" | "json";
  paletteCopied: boolean;
  onBaseColorChange: (color: string) => void;
  onPaletteNameChange: (name: string) => void;
  onTargetShadeChange: (shade: ShadeNumber) => void;
  onCurveTypeChange: (curveType: CurveType) => void;
  onExportFormatChange: (format: "tailwind" | "css" | "json") => void;
  onCopyExport: () => void;
  onDownloadExport: () => void;
}

// Resizable Panel State
export interface PanelSizes {
  editor: number; // percentage
  gallery: number; // percentage
  inspector: number; // percentage
}

// Panel Visibility State
export interface PanelVisibility {
  editor: boolean;
  gallery: boolean;
  inspector: boolean;
}
