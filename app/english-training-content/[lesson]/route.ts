import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getEnglishTrainingLessonFilePath } from "../../../lib/englishTraining.files";

type EnglishTrainingContentRouteProps = {
  params: Promise<{
    lesson: string;
  }>;
};

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow",
} as const;

export async function GET(_: Request, { params }: EnglishTrainingContentRouteProps) {
  const { lesson } = await params;
  const entry = await getEnglishTrainingLessonFilePath(lesson);

  if (!entry) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const html = await fs.readFile(entry.filePath, "utf-8");

  return new NextResponse(html, {
    status: 200,
    headers: HTML_HEADERS,
  });
}
