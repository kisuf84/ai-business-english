import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getEnglishTrainingLessonFilePath } from "../../../lib/englishTraining";

type EnglishTrainingContentRouteProps = {
  params: {
    lesson: string;
  };
};

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow",
} as const;

export async function GET(_: Request, { params }: EnglishTrainingContentRouteProps) {
  const entry = await getEnglishTrainingLessonFilePath(params.lesson);

  if (!entry) {
    return new NextResponse("Not found.", { status: 404 });
  }

  const html = await fs.readFile(entry.filePath, "utf-8");

  return new NextResponse(html, {
    status: 200,
    headers: HTML_HEADERS,
  });
}
