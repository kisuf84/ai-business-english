"use client";

import { useEffect, useRef, useState } from "react";
import Button from "../shared/Button";

type EnglishTrainingLessonReaderProps = {
  title: string;
  iframeSrc: string;
};

// "off": normal inline reader.
// "native": the browser's real Fullscreen API is engaged on the reader node.
// "fallback": Fullscreen API is unavailable or rejected the request, so we
//   simulate focus mode with fixed positioning instead. Kept as an explicit,
//   separate state (rather than reusing "native") so Exit Focus knows whether
//   it needs to call document.exitFullscreen() at all, and so the UI never
//   claims a real fullscreen session that never actually happened.
type FocusMode = "off" | "native" | "fallback";

export default function EnglishTrainingLessonReader({
  title,
  iframeSrc,
}: EnglishTrainingLessonReaderProps) {
  const readerRef = useRef<HTMLDivElement | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("off");

  useEffect(() => {
    const syncFocusMode = () => {
      const node = readerRef.current;
      if (document.fullscreenElement && document.fullscreenElement === node) {
        setFocusMode("native");
        return;
      }
      // Real fullscreen ended -- via Escape, an OS/back gesture, or the
      // browser's own chrome -- so drop back to the plain reader. Leave a
      // CSS "fallback" session alone here: it was never real fullscreen, so
      // this event isn't about it.
      setFocusMode((prev) => (prev === "native" ? "off" : prev));
    };

    document.addEventListener("fullscreenchange", syncFocusMode);
    return () => document.removeEventListener("fullscreenchange", syncFocusMode);
  }, []);

  const enterFocusMode = async () => {
    const node = readerRef.current;
    if (!node) return;

    if (typeof node.requestFullscreen === "function") {
      try {
        await node.requestFullscreen();
        // "native" is set by the fullscreenchange listener once the browser
        // confirms the transition -- don't set it here, or we'd be claiming
        // success before it actually happened.
        return;
      } catch {
        // Fullscreen API exists but refused the request (common on mobile
        // browsers/WebViews) -- fall through to the CSS fallback below.
      }
    }

    // No Fullscreen API support at all (e.g. mobile Safari, which never
    // supports it for non-video elements) -- use the deliberate CSS
    // fallback instead of silently pretending native fullscreen succeeded.
    setFocusMode("fallback");
  };

  const exitFocusMode = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Keep the local focus state usable even if the browser blocks
        // exitFullscreen -- Exit Focus must never become a dead button.
      }
    }
    setFocusMode("off");
  };

  const isFocusMode = focusMode !== "off";
  const isFallback = focusMode === "fallback";

  return (
    <div
      ref={readerRef}
      className={`min-h-0 flex-1 overflow-hidden bg-[var(--surface)] ${
        isFallback
          ? "fixed inset-x-0 top-0 z-50 m-0 flex h-dvh flex-col rounded-none p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          : isFocusMode
            ? "fixed inset-0 z-50 m-0 flex flex-col rounded-none p-0"
            : "flex flex-col border-t border-[var(--border)]"
      }`}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:px-4">
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
      <div className="h-full min-h-0 flex-1 bg-[var(--surface)]">
        <iframe
          title={title}
          src={iframeSrc}
          className="h-full min-h-0 w-full border-0 bg-white"
          allow="fullscreen; microphone"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
