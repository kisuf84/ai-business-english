"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../shared/Button";
import Select from "../shared/Select";
import LessonActions from "./LessonActions";
import type { LessonGenerationOutput } from "../../types/lesson";
import { lessonToText } from "../../lib/utils/lessonText";

type LessonToolbarProps = {
  lessonId: string;
  visibility: "private" | "public";
  status: "saved" | "draft" | "archived";
  lesson: LessonGenerationOutput;
};

export default function LessonToolbar({
  lessonId,
  visibility,
  status,
  lesson,
}: LessonToolbarProps) {
  const router = useRouter();
  const [currentVisibility, setCurrentVisibility] = useState(visibility);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVisibilityChange = async (value: "private" | "public") => {
    setIsWorking(true);
    setError(null);

    try {
      const response = await fetch("/api/lesson/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lessonId, visibility: value }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Visibility update failed");
      }

      setCurrentVisibility(value);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not update visibility. Please try again."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const handleCopy = async () => {
    setError(null);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(lessonToText(lesson));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("We could not copy the lesson.");
    }
  };

  const handleDownload = () => {
    const text = lessonToText(lesson);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${lesson.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3">
      <div className="grid gap-3">
        <div>
          <label htmlFor="visibility" className="text-sm font-medium text-[var(--ink)]">
            Visibility
          </label>
          <Select
            id="visibility"
            value={currentVisibility}
            onChange={(event) =>
              handleVisibilityChange(event.target.value as "private" | "public")
            }
            disabled={isWorking}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </Select>
        </div>

        {currentVisibility === "public" ? (
          <p className="break-all text-sm text-[var(--ink-muted)]">
            Share link:{" "}
            <a
              href={`/share/lesson/${lessonId}`}
              className="text-[var(--ink)] underline-offset-4 hover:underline"
            >
              /share/lesson/{lessonId}
            </a>
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button className="w-full sm:w-auto" onClick={handleCopy}>
            Copy Lesson
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleDownload}>
            Download .txt
          </Button>
          {copied ? <span className="text-sm text-[#047857]">Copied</span> : null}
        </div>

        <LessonActions lessonId={lessonId} status={status} />
        {error ? <p className="text-sm text-[crimson]">{error}</p> : null}
      </div>
    </div>
  );
}
