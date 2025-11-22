"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({ content, side = "top" }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
