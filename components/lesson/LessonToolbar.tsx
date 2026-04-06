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
        throw new Error("Visibility update failed");
      }

      setCurrentVisibility(value);
      router.refresh();
    } catch {
      setError("We could not update visibility.");
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
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label htmlFor="visibility">Visibility</label>
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button onClick={handleCopy}>Copy Lesson</Button>
          <Button onClick={handleDownload}>Download .txt</Button>
          {copied ? <span style={{ color: "#047857" }}>Copied</span> : null}
        </div>

        <LessonActions lessonId={lessonId} status={status} />
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      </div>
    </div>
  );
}
