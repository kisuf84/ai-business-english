"use client";

import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const syncFocusMode = () => {
      setIsFocusMode(document.fullscreenElement === readerRef.current);
    };

    document.addEventListener("fullscreenchange", syncFocusMode);
    return () => document.removeEventListener("fullscreenchange", syncFocusMode);
  }, []);

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
      className={`min-h-0 flex-1 overflow-hidden bg-[var(--surface)] ${
        isFocusMode
          ? "fixed inset-0 z-50 m-0 flex flex-col rounded-none p-0"
          : "flex flex-col border-t border-[var(--border)]"
      }`}
    >
      <div
        className={`shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:px-4 ${
          isFocusMode ? "flex" : "flex flex-wrap"
        }`}
      >
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Focus reader
          </p>
          <p className="mobile-safe-wrap mt-0.5 text-xs font-bold text-[var(--ink)] sm:text-sm">
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
        className={`min-h-0 w-full flex-1 border-0 bg-white ${
          isFocusMode
            ? "h-[calc(100dvh-65px)]"
            : "h-full"
        }`}
      />
    </div>
  );
}
