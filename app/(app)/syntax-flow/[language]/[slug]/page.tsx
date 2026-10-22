import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../../components/shared/ContentReaderPage";
import {
  isSyntaxFlowLanguage,
  getSyntaxFlowItem,
  SYNTAX_FLOW_LANGUAGES,
} from "../../../../../lib/syntaxFlow";

export default async function SyntaxFlowLessonPage({
  params,
}: {
  params: Promise<{ language: string; slug: string }>;
}) {
  const { language: languageSlug, slug } = await params;
  if (!isSyntaxFlowLanguage(languageSlug)) {
    notFound();
  }

  const language = SYNTAX_FLOW_LANGUAGES.find((entry) => entry.slug === languageSlug)!;
  const item = getSyntaxFlowItem(languageSlug, slug);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="SyntaxFlow"
      title={`${language.flag} ${language.label} · ${item.level} · ${item.title}`}
      iframeSrc={`/content/syntax-flow-${languageSlug}/${item.slug}`}
      backLinks={[{ href: `/syntax-flow/${languageSlug}`, label: `All ${language.label}` }]}
    />
  );
}
