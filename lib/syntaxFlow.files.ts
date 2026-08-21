import { resolveCuratedFilePath, type ContentLibraryId } from "./contentLibraries";
import { listSyntaxFlowItems, type SyntaxFlowLanguage } from "./syntaxFlow";

const LIBRARY_BY_LANGUAGE: Record<SyntaxFlowLanguage, ContentLibraryId> = {
  espanol: "syntax-flow-espanol",
  francais: "syntax-flow-francais",
  portugues: "syntax-flow-portugues",
};

/**
 * File-resolver companion to syntaxFlow.ts — see businessIndustries.files.ts
 * for why this is split out. Only app/content/[library]/[slug]/route.ts
 * should import this file.
 */
export async function getSyntaxFlowFilePath(
  language: SyntaxFlowLanguage,
  slug: string
): Promise<string | null> {
  return resolveCuratedFilePath(LIBRARY_BY_LANGUAGE[language], listSyntaxFlowItems(language), slug);
}
