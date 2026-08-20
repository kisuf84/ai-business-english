import { notFound } from "next/navigation";
import CatalogPageShell from "../../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../../components/shared/ContentCatalogSections";
import {
  isSyntaxFlowLanguage,
  listSyntaxFlowItems,
  SYNTAX_FLOW_LEVEL_ORDER,
  SYNTAX_FLOW_LANGUAGES,
} from "../../../../lib/syntaxFlow";

export default function SyntaxFlowLanguagePage({
  params,
}: {
  params: { language: string };
}) {
  if (!isSyntaxFlowLanguage(params.language)) {
    notFound();
  }

  const language = SYNTAX_FLOW_LANGUAGES.find((entry) => entry.slug === params.language)!;
  const items = listSyntaxFlowItems(params.language);

  return (
    <CatalogPageShell
      eyebrow="SyntaxFlow"
      title={`SyntaxFlow · ${language.flag} ${language.label}`}
      description="100 drag-and-drop Word Order sentences per CEFR level (A1 to C1), 3 volumes each, for building English sentence-structure fluency."
    >
      <ContentCatalogSections
        groups={SYNTAX_FLOW_LEVEL_ORDER.map((level) => ({
          key: level,
          label: level,
          items: items
            .filter((item) => item.level === level)
            .map((item) => ({
              id: item.id,
              title: item.title,
              href: `/syntax-flow/${params.language}/${item.slug}`,
              thumbnailUrl: item.thumbnailUrl,
              fallbackLabel: item.level,
              ctaLabel: "Start Practice",
            })),
        }))}
      />
    </CatalogPageShell>
  );
}
