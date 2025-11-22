"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { ParsedColor } from "@/lib/types";

interface CompareTabProps {
  originalColors: ParsedColor[];
  currentColors: ParsedColor[];
  originalText: string;
  currentText: string;
}

export function CompareTab({
  originalColors,
  currentColors,
  originalText,
  currentText,
}: CompareTabProps) {
  return (
    <div className="flex flex-col gap-8 h-full overflow-auto p-6">
      <div>
        <SectionHeader
          title="Palette Comparison"
          size="sm"
          className="mb-3"
        />
        <p className="text-sm text-muted-foreground mb-4">
          Compare your original color palette with the current modified version
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original Palette */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Original Palette</h3>
          <div className="p-4 bg-card border rounded-lg">
            {originalColors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No colors in original palette</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {originalColors.map(color => (
                  <div key={color.id} className="text-center">
                    <div
                      className="w-14 h-14 rounded border-2"
                      style={{ backgroundColor: color.normalized }}
                      title={color.normalized}
                    />
                    <span className="text-xs font-mono block mt-1.5">
                      {color.normalized}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {color.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Original Text Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Original Text</h4>
            <div className="p-4 bg-muted/50 border rounded-lg max-h-64 overflow-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {originalText}
              </pre>
            </div>
          </div>
        </div>

        {/* Current Palette */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Current Palette</h3>
          <div className="p-4 bg-card border rounded-lg">
            {currentColors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No colors in current palette</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {currentColors.map(color => (
                  <div key={color.id} className="text-center">
                    <div
                      className="w-14 h-14 rounded border-2"
                      style={{ backgroundColor: color.normalized }}
                      title={color.normalized}
                    />
                    <span className="text-xs font-mono block mt-1.5">
                      {color.normalized}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {color.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Text Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Current Text</h4>
            <div className="p-4 bg-muted/50 border rounded-lg max-h-64 overflow-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {currentText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
