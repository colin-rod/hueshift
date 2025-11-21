"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Undo,
  Redo,
  RefreshCw,
  Copy,
  Download,
  Check,
  ChevronDown,
  Menu,
  User,
  Palette,
} from "lucide-react";

interface HeaderProps {
  // Optional props for Color Parser page actions
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
  copied?: boolean;
}

export default function Header({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onReset,
  onCopy,
  onDownload,
  copied = false,
}: HeaderProps) {
  const pathname = usePathname();
  const isColorParserPage = pathname === "/";
  const isPalettePage = pathname === "/palette";
  const showActions = isColorParserPage && onUndo && onRedo && onReset && onCopy && onDownload;

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Description (inline) */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HueShift
              </h1>
              <span className="hidden sm:block text-muted-foreground">|</span>
              <p className="hidden sm:block text-sm text-muted-foreground">
                Parse, visualize, and replace colors instantly
              </p>
            </div>
          </Link>

          {/* Right: Navigation + Actions + User Menu */}
          <div className="flex items-center gap-2">
            {/* Palette Generator Link */}
            <Link href="/palette">
              <Button
                variant={isPalettePage ? "default" : "ghost"}
                size="sm"
                className="hidden md:flex"
              >
                <Palette className="w-4 h-4 mr-2" />
                Palette Generator
              </Button>
            </Link>

            {/* Separator if actions are shown */}
            {showActions && <div className="hidden md:block w-px h-6 bg-border mx-1" />}

            {/* Desktop Actions - Only on Color Parser page */}
            {showActions && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl/Cmd+Z)"
                >
                  <Undo className="w-4 h-4 mr-2" />
                  Undo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Redo (Ctrl/Cmd+Shift+Z)"
                >
                  <Redo className="w-4 h-4 mr-2" />
                  Redo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  title="Reset to original"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Export
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onCopy}>
                      {copied ? (
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
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile Menu - Show on all pages */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-2 mt-8">
                  {/* Navigation */}
                  <h3 className="text-sm font-semibold mb-2">Navigation</h3>
                  <SheetClose asChild>
                    <Link href="/palette">
                      <Button
                        variant={isPalettePage ? "default" : "ghost"}
                        className="justify-start w-full"
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Palette Generator
                      </Button>
                    </Link>
                  </SheetClose>

                  {/* Actions - Only on Color Parser page */}
                  {showActions && (
                    <>
                      <div className="h-px bg-border my-2" />
                      <h3 className="text-sm font-semibold mb-2">Actions</h3>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={onUndo}
                        disabled={!canUndo}
                      >
                        <Undo className="w-4 h-4 mr-2" />
                        Undo
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={onRedo}
                        disabled={!canRedo}
                      >
                        <Redo className="w-4 h-4 mr-2" />
                        Redo
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={onReset}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </SheetClose>
                    <div className="h-px bg-border my-2" />
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={onCopy}
                      >
                        {copied ? (
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
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={onDownload}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </SheetClose>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* User Menu Placeholder */}
            <Button variant="ghost" size="sm" className="rounded-full" title="User menu">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
