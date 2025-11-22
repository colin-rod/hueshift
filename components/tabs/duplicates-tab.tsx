"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { SimilarColorGroup, ParsedColor } from "@/lib/types";

interface DuplicatesTabProps {
  similarColorGroups: SimilarColorGroup[];
  uniqueColors: ParsedColor[];
  similarityThreshold: number;
  onSimilarityThresholdChange: (threshold: number) => void;
  onMergeSimilarColors: (group: SimilarColorGroup) => void;
}

export function DuplicatesTab({
  similarColorGroups,
  uniqueColors,
  similarityThreshold,
  onSimilarityThresholdChange,
  onMergeSimilarColors,
}: DuplicatesTabProps) {
  return (
    <div className="flex flex-col gap-6 h-full overflow-auto p-4">
      <div>
        <SectionHeader
          title="Similar Colors"
          size="sm"
          className="mb-3"
        />
        <p className="text-sm text-muted-foreground mb-4">
          Find and merge visually similar colors to maintain consistency
        </p>
      </div>

      {/* Sensitivity Slider */}
      <div className="p-3 md:p-4 bg-card border rounded-lg">
        <div className="flex items-center mb-2">
          <label className="text-xs font-medium">
            Sensitivity: {similarityThreshold.toFixed(1)} Delta-E
            <span className="ml-2 text-muted-foreground font-normal">
              ({similarityThreshold < 5 ? "Very Strict" : similarityThreshold < 10 ? "Moderate" : "Relaxed"})
            </span>
          </label>
          <InfoTooltip content="Delta-E measures color difference. Lower values find only nearly identical colors. Higher values catch colors that look similar but have slightly different values." />
        </div>
        <input
          type="range"
          min="3"
          max="15"
          step="0.5"
          value={similarityThreshold}
          onChange={(e) => onSimilarityThresholdChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Strict</span>
          <span>Relaxed</span>
        </div>
      </div>

      {/* Similar Color Groups */}
      {similarColorGroups.length === 0 ? (
        <div className="p-8 text-center bg-card border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No similar colors detected at current sensitivity level
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Try adjusting the sensitivity slider above
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {similarColorGroups.map((group, idx) => (
            <div key={idx} className="p-4 bg-card border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Group {idx + 1}</span>
                <Badge variant="secondary" className="text-xs">
                  {group.totalCount} total uses
                </Badge>
              </div>

              <div className="space-y-2">
                {/* Representative Color */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <div
                    className="w-12 h-12 rounded border-2 border-blue-400 flex-shrink-0"
                    style={{ backgroundColor: group.representative }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono font-semibold">
                      {group.representative}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Representative • {uniqueColors.find(c => c.normalized === group.representative)?.count || 0} uses
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs px-2">
                    Main
                  </Badge>
                </div>

                {/* Similar Colors */}
                {group.similar.map((similar, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-3 p-3 border rounded hover:bg-muted transition-colors">
                    <div
                      className="w-10 h-10 rounded border flex-shrink-0"
                      style={{ backgroundColor: similar.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono">
                        {similar.color}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Δ {similar.distance.toFixed(1)} • {similar.count} uses
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => onMergeSimilarColors(group)}
              >
                Merge All → {group.representative}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
