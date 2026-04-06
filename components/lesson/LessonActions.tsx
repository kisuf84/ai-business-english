"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../shared/Button";

type LessonActionsProps = {
  lessonId: string;
  status?: "saved" | "draft" | "archived";
};

export default function LessonActions({ lessonId, status }: LessonActionsProps) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runAction = async (endpoint: string, onSuccess?: (id?: string) => void) => {
    setIsWorking(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lessonId }),
      });

      if (!response.ok) {
        throw new Error("Action failed.");
      }

      const data = (await response.json()) as { id?: string };
      onSuccess?.(data.id);
    } catch {
      setError("We could not complete that action.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleDuplicate = () => {
    runAction("/api/lesson/duplicate", (newId) => {
      if (newId) {
        router.push(`/lessons/${newId}?duplicated=1`);
      }
    });
  };

  const handleArchive = () => {
    runAction("/api/lesson/archive", () => {
      router.push(`/lessons/${lessonId}?archived=1`);
      setMessage("Lesson archived.");
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lesson?"
    );
    if (!confirmed) return;
    runAction("/api/lesson/delete", () => router.push("/lessons"));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={handleDuplicate} disabled={isWorking}>
          {isWorking ? "Working..." : "Duplicate"}
        </Button>
        <Button
          onClick={handleArchive}
          disabled={isWorking || status === "archived"}
        >
          {isWorking ? "Working..." : status === "archived" ? "Archived" : "Archive"}
        </Button>
        <Button onClick={handleDelete} disabled={isWorking}>
          {isWorking ? "Working..." : "Delete"}
        </Button>
      </div>
      {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </div>
  );
}
