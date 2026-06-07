"use client";

import { useEffect, useRef, useState } from "react";
import Button from "../shared/Button";

type PremiumModuleReaderProps = {
  title: string;
  iframeSrc: string;
  courseSlug: string;
};

const sectionLinks = [
  { id: "sec-overview", label: "Overview" },
  { id: "sec-speaking", label: "Speaking" },
  { id: "sec-reading", label: "Reading" },
  { id: "sec-grammar", label: "Grammar" },
  { id: "sec-gramreview", label: "Grammar Review" },
  { id: "sec-vocab", label: "Vocabulary" },
  { id: "sec-wordbank", label: "Word Bank" },
  { id: "sec-writing", label: "Writing" },
  { id: "sec-listening", label: "Listening" },
  { id: "sec-cases", label: "Case Studies" },
  { id: "sec-assessment", label: "Assessment" },
] as const;

type SectionId = (typeof sectionLinks)[number]["id"];

export default function PremiumModuleReader({
  title,
  iframeSrc,
  courseSlug,
}: PremiumModuleReaderProps) {
  const isBriceCourse = new Set([
    "bricepremiumcourses1", "bricepremiumcourses2", "bricepremiumcourses3",
    "bricepremiumcourses4", "bricepremiumcourses5", "bricepremiumcourses6",
    "bricepremiumcourses7", "bricepremiumcourses8", "bricepremiumcourses9",
    "bricepremiumcourses10", "bricepremiumcourses11", "bricepremiumcourses12",
    "bricepremiumcourses13", "bricepremiumcourses14", "bricepremiumcourses15",
    "bricepremiumcourses16", "bricepremiumcourses17", "bricepremiumcourses18",
    "bricepremiumcourses19",
  ]).has(courseSlug);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeScrollCleanupRef = useRef<(() => void) | null>(null);
  const baseIframeSrc = iframeSrc.split("#")[0];
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>(sectionLinks[0].id);
  const [availableSectionIds, setAvailableSectionIds] = useState<SectionId[]>(
    sectionLinks.map((section) => section.id)
  );
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [pendingSectionId, setPendingSectionId] = useState<SectionId | null>(null);
  const [iframeLocation, setIframeLocation] = useState(baseIframeSrc);

  useEffect(() => {
    const syncFocusMode = () => {
      setIsFocusMode(document.fullscreenElement === readerRef.current);
    };

    document.addEventListener("fullscreenchange", syncFocusMode);
    return () => document.removeEventListener("fullscreenchange", syncFocusMode);
  }, []);

  const getIframeHandles = () => {
    const iframe = iframeRef.current;
    if (!iframe) return null;

    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframe.contentDocument ?? iframeWindow?.document ?? null;

    if (!iframeWindow || !iframeDocument) {
      return null;
    }

    return { iframeWindow, iframeDocument };
  };

  const syncIframeSections = (preferredSectionId?: SectionId) => {
    const handles = getIframeHandles();
    if (!handles) return [];

    const visibleSections = sectionLinks
      .map((section) => section.id)
      .filter((id): id is SectionId => Boolean(handles.iframeDocument.getElementById(id)));

    if (visibleSections.length > 0) {
      setAvailableSectionIds(visibleSections);

      if (preferredSectionId && visibleSections.includes(preferredSectionId)) {
        setActiveSectionId(preferredSectionId);
      } else if (!visibleSections.includes(activeSectionId)) {
        setActiveSectionId(visibleSections[0]);
      }
    }

    return visibleSections;
  };

  const navigateToSection = (sectionId: SectionId) => {
    const handles = getIframeHandles();
    if (!handles) {
      setPendingSectionId(sectionId);
      setIframeLocation(`${baseIframeSrc}#${sectionId}`);
      return false;
    }

    const target = handles.iframeDocument.getElementById(sectionId);
    if (!target) {
      setPendingSectionId(sectionId);
      setIframeLocation(`${baseIframeSrc}#${sectionId}`);
      return false;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSectionId(sectionId);
    setPendingSectionId(null);
    return true;
  };

  const handleSectionClick = (sectionId: SectionId) => {
    setActiveSectionId(sectionId);

    if (!iframeLoaded) {
      setPendingSectionId(sectionId);
      setIframeLocation(`${baseIframeSrc}#${sectionId}`);
      return;
    }

    navigateToSection(sectionId);
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    iframeScrollCleanupRef.current?.();
    iframeScrollCleanupRef.current = null;

    const handles = getIframeHandles();
    if (!handles) return;

    const visibleSections = syncIframeSections(pendingSectionId ?? undefined);

    const updateActiveSection = () => {
      const sections = visibleSections
        .map((id) => handles.iframeDocument.getElementById(id))
        .filter((section): section is HTMLElement => Boolean(section));

      if (sections.length === 0) return;

      const current = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= 180;
      });

      if (current?.id) {
        setActiveSectionId(current.id as SectionId);
        return;
      }

      const fallback = [...sections]
        .reverse()
        .find((section) => section.getBoundingClientRect().top <= 180);

      if (fallback?.id) {
        setActiveSectionId(fallback.id as SectionId);
      }
    };

    handles.iframeWindow.addEventListener("scroll", updateActiveSection, { passive: true, capture: true });
    handles.iframeWindow.addEventListener("hashchange", updateActiveSection);
    iframeScrollCleanupRef.current = () => {
      handles.iframeWindow.removeEventListener("scroll", updateActiveSection, { capture: true });
      handles.iframeWindow.removeEventListener("hashchange", updateActiveSection);
    };
    updateActiveSection();

    if (pendingSectionId) {
      window.setTimeout(() => {
        navigateToSection(pendingSectionId);
      }, 0);
    }
  };

  useEffect(() => {
    setAvailableSectionIds(sectionLinks.map((section) => section.id));
    setActiveSectionId(sectionLinks[0].id);
    setIframeLoaded(false);
    setPendingSectionId(null);
    setIframeLocation(baseIframeSrc);
  }, [baseIframeSrc]);

  useEffect(
    () => () => {
      iframeScrollCleanupRef.current?.();
    },
    []
  );

  const visibleSections = sectionLinks.filter((section) =>
    availableSectionIds.includes(section.id)
  );

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
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={`flex h-full min-h-0 flex-col ${isBriceCourse ? "" : "lg:grid lg:grid-cols-[240px_minmax(0,1fr)]"}`}>
          {!isBriceCourse && (
            <aside className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 lg:sticky lg:top-0 lg:h-full lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                Module sections
              </p>
              <nav className="mt-3">
                <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                  {visibleSections.map((section) => {
                    const isActive = activeSectionId === section.id;

                    return (
                      <li key={section.id} className="shrink-0 lg:shrink">
                        <button
                          type="button"
                          onClick={() => handleSectionClick(section.id)}
                          className={`w-full rounded-full border px-3 py-2 text-left text-xs font-semibold transition lg:rounded-2xl ${
                            isActive
                              ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {section.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          )}
          <div className="h-full min-h-0 bg-[var(--surface)]">
            <iframe
              ref={iframeRef}
              title={title}
              src={iframeLocation}
              onLoad={handleIframeLoad}
              className={`min-h-0 w-full border-0 bg-white ${
                isFocusMode ? "h-[calc(100dvh-65px)]" : "h-full"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
