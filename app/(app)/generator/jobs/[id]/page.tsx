"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  last_error_code?: string | null;
  last_error_message?: string | null;
  message: string | null;
};

function getStatusCopy(job: JobStatus) {
  if (job.status === "queued") {
    return {
      title: "✨ Your lesson is in the queue...",
      body: "We’ll start processing it shortly and email you when it’s ready.",
    };
  }

  if (job.status === "processing") {
    return {
      title: "✨ Creating your lesson...",
      body: "We’re turning the video into a structured Business English lesson.",
    };
  }

  if (job.status === "ready") {
    return {
      title: "Lesson ready.",
      body: "Your lesson is complete and ready to open.",
    };
  }

  if (job.status === "failed") {
    return {
      title: "We couldn’t finish this lesson automatically.",
      body:
        job.message ||
        "You can try another YouTube link or paste a transcript if you have one.",
    };
  }

  return {
    title: "Have a transcript? Paste it to finish your lesson.",
    body:
      "Some YouTube videos do not expose captions to external tools. If you paste the transcript, we can complete the lesson from here.",
  };
}

export default function YouTubeJobPage({ params }: { params: { id: string } }) {
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

  const statusCopy = job ? getStatusCopy(job) : null;
  const canContinueWithTranscript =
    job?.status === "needs_transcript" ||
    (job?.status === "failed" &&
      (job.last_error_code === "no_captions" ||
        job.last_error_code === "captions_disabled" ||
        job.last_error_code === "unsupported_video" ||
        job.last_error_code === "transcript_fetch_failed"));

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

          {job?.status === "queued" ||
          job?.status === "processing" ||
          job?.status === "ready" ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-[var(--ink)]">
                {statusCopy?.title}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                {statusCopy?.body}
              </p>
              {job?.status === "ready" && job.lesson_url ? (
                <Link href={job.lesson_url} className="mt-2 inline-flex">
                  <Button
                    type="button"
                    className="rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-2 text-xs font-semibold text-[#0c0b0a] hover:bg-[#d4ad55]"
                  >
                    Open Lesson
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}

          {canContinueWithTranscript ? (
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  {statusCopy?.title}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {statusCopy?.body}
                </p>
                {job?.last_error_message ? (
                  <p className="mt-2 text-xs text-[var(--ink-faint)]">
                    {job.last_error_message}
                  </p>
                ) : null}
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

          {job?.status === "failed" && !canContinueWithTranscript ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-[var(--ink)]">
                {statusCopy?.title}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                {statusCopy?.body}
              </p>
              {job.last_error_message ? (
                <p className="text-xs text-[var(--ink-faint)]">
                  {job.last_error_message}
                </p>
              ) : null}
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
