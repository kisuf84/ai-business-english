"use client";

import { useRef, useState } from "react";
import Button from "../shared/Button";

type PremiumModuleReaderProps = {
  title: string;
  iframeSrc: string;
};

export default function PremiumModuleReader({
  title,
  iframeSrc,
}: PremiumModuleReaderProps) {
  const readerRef = useRef<HTMLDivElement | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const enterFocusMode = async () => {
    const node = readerRef.current;
    if (!node) return;

    try {
      if (node.requestFullscreen) {
        await node.requestFullscreen();
      }
      setIsFocusMode(true);
    } catch {
      setIsFocusMode(true);
    }
  };

  const exitFocusMode = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Keep the local focus state usable even if the browser blocks exitFullscreen.
    }
    setIsFocusMode(false);
  };

  return (
    <div
      ref={readerRef}
      className={`mt-6 overflow-hidden border border-[var(--border)] bg-[var(--surface)] ${
        isFocusMode
          ? "fixed inset-0 z-50 rounded-none p-2 sm:p-4"
          : "rounded-[var(--radius-md)] p-1 sm:p-2"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Focus reader
          </p>
          <p className="mobile-safe-wrap mt-1 text-sm font-bold text-[var(--ink)]">
            {title}
          </p>
        </div>
        {isFocusMode ? (
          <Button type="button" onClick={() => void exitFocusMode()} className="px-4 py-2 text-xs">
            Exit focus
          </Button>
        ) : (
          <Button type="button" onClick={() => void enterFocusMode()} className="px-4 py-2 text-xs">
            Focus mode
          </Button>
        )}
      </div>
      <iframe
        title={title}
        src={iframeSrc}
        className={`w-full border-0 bg-white ${
          isFocusMode
            ? "h-[calc(100vh-86px)]"
            : "h-[72vh] min-h-[420px] sm:h-[84vh] sm:min-h-[760px]"
        }`}
      />
    </div>
  );
}
