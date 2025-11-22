"use client";

import { PanelLeftClose, PanelLeftOpen, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorToggleProps {
  isVisible: boolean;
  isLocked: boolean;
  onToggle: () => void;
  onLockToggle: () => void;
}

export function EditorToggle({ isVisible, isLocked, onToggle, onLockToggle }: EditorToggleProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="h-8"
        title={isVisible ? "Hide editor" : "Show editor"}
      >
        {isVisible ? (
          <>
            <PanelLeftClose className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Hide Editor</span>
            <span className="sm:hidden">Hide</span>
          </>
        ) : (
          <>
            <PanelLeftOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Show Editor</span>
            <span className="sm:hidden">Show</span>
          </>
        )}
      </Button>

      {isVisible && (
        <Button
          variant={isLocked ? "default" : "outline"}
          size="sm"
          onClick={onLockToggle}
          className="h-8 px-2"
          title={isLocked ? "Unlock editor (auto-hide on tab change)" : "Lock editor (keep visible on all tabs)"}
        >
          {isLocked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Unlock className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}
