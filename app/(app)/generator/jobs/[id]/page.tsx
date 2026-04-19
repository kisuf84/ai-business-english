"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../../../../components/shared/Button";
import Card from "../../../../../components/shared/Card";
import Textarea from "../../../../../components/shared/Textarea";

type JobStatus = {
  id: string;
  status: "queued" | "processing" | "ready" | "needs_transcript" | "failed";
  lesson_id: string | null;
  lesson_url: string | null;
  title: string | null;
  needs_transcript: boolean;
  message: string | null;
};

export default function YouTubeJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<JobStatus | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadJob = async () => {
    try {
      const response = await fetch(`/api/youtube-jobs/${params.id}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("load_failed");
      const data = (await response.json()) as JobStatus;
      setJob(data);
      if (data.status === "ready" && data.lesson_url) {
        router.replace(data.lesson_url);
      }
    } catch {
      setError("We couldn’t load this lesson job.");
    }
  };

  useEffect(() => {
    void loadJob();
    const interval = window.setInterval(() => {
      void loadJob();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [params.id]);

  const submitTranscript = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/youtube-jobs/${params.id}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "submit_failed");
      }
      await loadJob();
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "submit_failed"
          ? err.message
          : "We couldn’t continue this lesson. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mobile-page-shell py-8">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            YouTube Lesson
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Lesson Status
          </h1>
        </div>

        <Card>
          {!job ? (
            <p className="text-sm text-[var(--ink-muted)]">
              ✨ Loading your lesson...
            </p>
          ) : null}

          {job?.status === "queued" || job?.status === "processing" ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-[var(--ink)]">
                ✨ Creating your lesson...
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                We’ll email you a link as soon as it’s ready.
              </p>
            </div>
          ) : null}

          {job?.status === "needs_transcript" || job?.status === "failed" ? (
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  Have a transcript? Paste it to finish your lesson.
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  We’ll use it to complete the lesson and send you the link.
                </p>
              </div>
              <Textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={10}
                placeholder="Paste the video transcript here..."
              />
              <Button
                type="button"
                onClick={submitTranscript}
                disabled={isSubmitting || transcript.trim().length < 100}
                className="w-full rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55] sm:w-auto"
              >
                {isSubmitting ? "Continuing..." : "Continue Lesson"}
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-[var(--accent-warm)]">{error}</p>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
