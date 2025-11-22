"use client";

import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useState } from "react";

interface ExportTabProps {
  originalText: string;
  currentText: string;
}

type ExportFormat = "txt" | "css" | "json" | "html";

export function ExportTab({ originalText, currentText }: ExportTabProps) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("txt");

  const handleCopyOriginal = async () => {
    await navigator.clipboard.writeText(originalText);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const handleCopyCurrent = async () => {
    await navigator.clipboard.writeText(currentText);
    setCopiedCurrent(true);
    setTimeout(() => setCopiedCurrent(false), 2000);
  };

  const getFileExtension = (format: ExportFormat) => {
    switch (format) {
      case "css": return "css";
      case "json": return "json";
      case "html": return "html";
      default: return "txt";
    }
  };

  const getMimeType = (format: ExportFormat) => {
    switch (format) {
      case "css": return "text/css";
      case "json": return "application/json";
      case "html": return "text/html";
      default: return "text/plain";
    }
  };

  const handleDownloadOriginal = () => {
    const extension = getFileExtension(exportFormat);
    const mimeType = getMimeType(exportFormat);
    const blob = new Blob([originalText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hueshift-original.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCurrent = () => {
    const extension = getFileExtension(exportFormat);
    const mimeType = getMimeType(exportFormat);
    const blob = new Blob([currentText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hueshift-output.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-auto p-6">
      <div>
        <SectionHeader
          title="Export"
          size="sm"
          className="mb-3"
        />
        <p className="text-sm text-muted-foreground mb-4">
          Copy or download your original and modified text
        </p>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Download Format:</label>
          <div className="flex gap-2">
            {(["txt", "css", "json", "html"] as ExportFormat[]).map((format) => (
              <Button
                key={format}
                variant={exportFormat === format ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat(format)}
                className="text-xs"
              >
                .{format}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Text */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Original Text</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyOriginal}
              >
                {copiedOriginal ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadOriginal}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <div className="p-4 bg-muted/50 border rounded-lg h-[calc(100vh-300px)] overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {originalText}
            </pre>
          </div>
        </div>

        {/* Current Text */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Text</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCurrent}
              >
                {copiedCurrent ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCurrent}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <div className="p-4 bg-muted/50 border rounded-lg h-[calc(100vh-300px)] overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {currentText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
