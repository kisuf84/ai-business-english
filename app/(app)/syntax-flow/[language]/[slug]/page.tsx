import { notFound } from "next/navigation";
import ContentReaderPage from "../../../../../components/shared/ContentReaderPage";
import {
  isSyntaxFlowLanguage,
  getSyntaxFlowItem,
  SYNTAX_FLOW_LANGUAGES,
} from "../../../../../lib/syntaxFlow";

export default function SyntaxFlowLessonPage({
  params,
}: {
  params: { language: string; slug: string };
}) {
  if (!isSyntaxFlowLanguage(params.language)) {
    notFound();
  }

  const language = SYNTAX_FLOW_LANGUAGES.find((entry) => entry.slug === params.language)!;
  const item = getSyntaxFlowItem(params.language, params.slug);
  if (!item) {
    notFound();
  }

  return (
    <ContentReaderPage
      eyebrow="Syntax Flow"
      title={`${language.flag} ${language.label} · ${item.level} · ${item.title}`}
      iframeSrc={`/content/syntax-flow-${params.language}/${item.slug}`}
      backLinks={[{ href: `/syntax-flow/${params.language}`, label: `All ${language.label}` }]}
    />
  );
}
