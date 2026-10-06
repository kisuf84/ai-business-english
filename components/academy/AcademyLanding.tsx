"use client";

import { useEffect, useState } from "react";

const SOURCE_URL = "/academy-landing.html";
const PLATFORM_URL = "/apps/academy/platform";

export default function AcademyLanding() {
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const response = await fetch(SOURCE_URL);
      if (!response.ok) throw new Error(`Unable to load Academy landing (${response.status})`);

      let source = await response.text();
      source = source
        .replace("<head>", "<head><base href=\"/\">")
        .replaceAll("openModal('loginModal')", `window.top.location.assign('${PLATFORM_URL}')`)
        .replaceAll("openModal('signupModal')", `window.top.location.assign('${PLATFORM_URL}')`)
        .replaceAll("openModal(\"loginModal\")", `window.top.location.assign('${PLATFORM_URL}')`)
        .replaceAll("openModal(\"signupModal\")", `window.top.location.assign('${PLATFORM_URL}')`)
        .replaceAll("handleLogin()", `window.top.location.assign('${PLATFORM_URL}')`)
        .replaceAll("handleSignup()", `window.top.location.assign('${PLATFORM_URL}')`);

      if (cancelled) return;
      setSrcDoc(source);
    };

    void load().catch((error: unknown) => {
      if (!cancelled) console.error("Academy landing failed to initialize", error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <iframe
      title="Langslate Academy landing"
      srcDoc={srcDoc}
      className="h-[calc(100dvh-var(--topbar-h)-36px)] min-h-[720px] w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#0d1117]"
    />
  );
}
