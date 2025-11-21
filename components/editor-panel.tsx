"use client";

import { HighlightedTextEditor } from "@/components/highlighted-text-editor";
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
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Text Editor</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Paste your code or text containing colors
        </p>
      </div>

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
