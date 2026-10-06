"use client";

import { useEffect, useState } from "react";

const SOURCE_URL = "/corporate-sept14-landing.html";
const PLATFORM_URL = "/apps/corporate/platform";

export default function CorporateSept14Landing() {
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await fetch(SOURCE_URL);
      if (!response.ok) throw new Error(`Unable to load Corporate landing (${response.status})`);
      let source = await response.text();
      source = source
        .replace("<head>", "<head><base href=\"/\">")
        .replaceAll("Auth.open('signup')", `window.top.location.assign('${PLATFORM_URL}')`)
        .replaceAll("Auth.open('login')", `window.top.location.assign('${PLATFORM_URL}')`)
        .replaceAll("Auth.submit('signup',event)", `window.top.location.assign('${PLATFORM_URL}');return false`)
        .replaceAll("Auth.submit('login',event)", `window.top.location.assign('${PLATFORM_URL}');return false`)
        .replaceAll("Auth.submit('google',event)", `window.top.location.assign('${PLATFORM_URL}');return false`)
        .replaceAll("Auth.submit('email', event)", `window.top.location.assign('${PLATFORM_URL}');return false`);

      if (cancelled) return;
      setSrcDoc(source);
    };

    void load().catch((error: unknown) => {
      if (!cancelled) console.error("Corporate landing failed to initialize", error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <iframe
      title="Langslate Corporate landing"
      srcDoc={srcDoc}
      className="h-[calc(100dvh-var(--topbar-h)-36px)] min-h-[720px] w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-white"
    />
  );
}
