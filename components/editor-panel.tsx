"use client";

import { HighlightedTextEditor } from "@/components/highlighted-text-editor";
import { SectionHeader } from "@/components/ui/section-header";
import { EditorPanelProps } from "@/lib/types";

export function EditorPanel({
  text,
  onTextChange,
  parsedColors,
  uniqueColors,
  selectedColor,
}: Omit<EditorPanelProps, 'canUndo' | 'canRedo' | 'onUndo' | 'onRedo' | 'onReset' | 'onCopy' | 'onDownload' | 'copied'>) {
  return (
    <div className="flex flex-col gap-6 h-full">
      <SectionHeader
        title="Text Editor"
        description="Paste your code or text containing colors"
      />

      <HighlightedTextEditor
        value={text}
        onChange={onTextChange}
        parsedColors={parsedColors}
        selectedColor={selectedColor}
        placeholder="Paste your CSS, HTML, SVG, or any text with colors..."
      />

      <div className="text-sm text-muted-foreground">
        {parsedColors.length} color{parsedColors.length !== 1 ? "s" : ""} detected
        ({uniqueColors.length} unique)
      </div>
    </div>
  );
}
