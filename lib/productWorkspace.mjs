const HTML_WORKSPACES = Object.freeze({
  flow: Object.freeze({ src: "/content/langslate-flow/app", title: "Langslate Flow" }),
  365: Object.freeze({ src: "/content/langslate-365/course", title: "Langslate 365" }),
});

export function getOriginalHtmlWorkspace(product) {
  return HTML_WORKSPACES[product] || null;
}
