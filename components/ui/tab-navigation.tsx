"use client";

import { Badge } from "@/components/ui/badge";

export type TabType = "colors" | "duplicates" | "pairs" | "compare" | "generate" | "export";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  duplicatesCount?: number;
  pairsCount?: number;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  duplicatesCount = 0,
  pairsCount = 0,
}: TabNavigationProps) {
  const tabs: { id: TabType; label: string; count?: number; tooltip: string }[] = [
    { id: "colors", label: "Colors", tooltip: "View and manage all colors found in your text" },
    { id: "duplicates", label: "Duplicates", count: duplicatesCount, tooltip: "Find and merge similar colors that are slightly different" },
    { id: "pairs", label: "Pairs", count: pairsCount, tooltip: "View detected foreground/background color combinations" },
    { id: "compare", label: "Compare", tooltip: "Compare your original color palette with the current version" },
    { id: "generate", label: "Generate", tooltip: "Create new color palettes with Tailwind CSS shades" },
    { id: "export", label: "Export", tooltip: "Copy or download your text in various formats" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          title={tab.tooltip}
          className={`
            px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
            ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }
          `}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <Badge
                variant={activeTab === tab.id ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {tab.count}
              </Badge>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
