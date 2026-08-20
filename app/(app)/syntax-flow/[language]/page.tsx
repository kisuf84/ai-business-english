import { notFound } from "next/navigation";
import CatalogPageShell from "../../../../components/shared/CatalogPageShell";
import ContentCatalogSections from "../../../../components/shared/ContentCatalogSections";
import {
  isSyntaxFlowLanguage,
  listSyntaxFlowItems,
  SYNTAX_FLOW_LEVEL_ORDER,
  SYNTAX_FLOW_LANGUAGES,
  SYNTAX_FLOW_HEADLINE,
  SYNTAX_FLOW_DESCRIPTION,
  SYNTAX_FLOW_DESCRIPTION_2,
  SYNTAX_FLOW_CLOSING,
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
      description={
        <>
          <strong className="text-[var(--ink)]">{SYNTAX_FLOW_HEADLINE}</strong>
          <br />
          <br />
          {SYNTAX_FLOW_DESCRIPTION}
          <br />
          <br />
          {SYNTAX_FLOW_DESCRIPTION_2}
          <br />
          <br />
          <strong className="text-[var(--ink)]">{SYNTAX_FLOW_CLOSING}</strong>
        </>
      }
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
