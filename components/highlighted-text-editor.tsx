"use client";

import { useRef, useEffect, useState } from "react";
import type { ParsedColor } from "@/lib/color-parser";

interface HighlightedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  parsedColors: ParsedColor[];
  selectedColor: string | null;
  placeholder?: string;
}

export function HighlightedTextEditor({
  value,
  onChange,
  parsedColors,
  selectedColor,
  placeholder,
}: HighlightedTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and backdrop
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Generate highlighted markup
  const generateHighlightedMarkup = () => {
    if (!value) {
      return `<span class="text-muted-foreground">${placeholder || ""}</span>`;
    }

    const sortedColors = [...parsedColors].sort((a, b) => a.startIndex - b.startIndex);

    let html = "";
    let lastIndex = 0;

    sortedColors.forEach((color) => {
      // Add text before color
      if (color.startIndex > lastIndex) {
        html += escapeHtml(value.substring(lastIndex, color.startIndex));
      }

      // Add highlighted color
      const colorText = value.substring(color.startIndex, color.endIndex);
      const isSelected = selectedColor === color.normalized;

      if (isSelected) {
        html += `<mark class="bg-blue-300 dark:bg-blue-700 text-inherit font-bold border-2 border-blue-600 rounded-sm px-0.5 -mx-0.5">${escapeHtml(colorText)}</mark>`;
      } else {
        html += `<mark class="bg-yellow-200 dark:bg-yellow-800/50 text-inherit rounded-sm px-0.5 -mx-0.5">${escapeHtml(colorText)}</mark>`;
      }

      lastIndex = color.endIndex;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      html += escapeHtml(value.substring(lastIndex));
    }

    return html;
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>")
      .replace(/ /g, "&nbsp;");
  };

  return (
    <div className="relative flex-grow w-full h-full">
      {/* Backdrop with highlights */}
      <div
        ref={backdropRef}
        className="absolute inset-0 font-mono text-sm p-3 border border-input rounded-md overflow-auto whitespace-pre-wrap break-words pointer-events-none bg-background"
        style={{
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
        dangerouslySetInnerHTML={{ __html: generateHighlightedMarkup() }}
      />

      {/* Textarea overlay */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="absolute inset-0 font-mono text-sm p-3 border border-input rounded-md resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 caret-foreground"
        style={{
          color: "inherit",
        }}
      />
    </div>
  );
}
