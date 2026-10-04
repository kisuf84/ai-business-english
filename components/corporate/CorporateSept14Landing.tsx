"use client";

import { useEffect, useRef } from "react";

const SOURCE_URL = "/corporate-sept14-landing.html";

export default function CorporateSept14Landing() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const addedHeadNodes: HTMLElement[] = [];
    const addedScripts: HTMLScriptElement[] = [];
    const previousTheme = document.documentElement.getAttribute("data-theme");
    const previousOverflow = document.body.style.overflow;

    const load = async () => {
      const response = await fetch(SOURCE_URL);
      if (!response.ok) throw new Error(`Unable to load Corporate landing (${response.status})`);
      let source = await response.text();
      source = source
        .replaceAll("Auth.open('signup')", "window.location.assign('/apps/corporate/platform')")
        .replaceAll("Auth.open('login')", "window.location.assign('/auth')")
        .replaceAll("Auth.submit('signup',event)", "window.location.assign('/auth');return false")
        .replaceAll("Auth.submit('login',event)", "window.location.assign('/auth');return false")
        .replaceAll("Auth.submit('google',event)", "window.location.assign('/auth');return false")
        .replaceAll("Auth.submit('email', event)", "window.location.assign('/auth');return false");

      const parsed = new DOMParser().parseFromString(source, "text/html");
      if (cancelled) return;
      const sourceTheme = parsed.documentElement.getAttribute("data-theme");
      if (sourceTheme) document.documentElement.setAttribute("data-theme", sourceTheme);

      parsed.head.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.dataset.corporateSept14 = "true";
        document.head.appendChild(clone);
        addedHeadNodes.push(clone);
      });

      const navRight = parsed.body.querySelector("#nav .nav-right");
      if (navRight) {
        const backLink = parsed.createElement("a");
        backLink.className = "nav-back-apps";
        backLink.href = "/dashboard";
        backLink.setAttribute("aria-label", "Back to Langslate dashboard");
        backLink.innerHTML = "<span aria-hidden=\"true\">←</span> Back to Langslate";
        navRight.prepend(backLink);
      }

      const navStyle = document.createElement("style");
      navStyle.dataset.corporateSept14 = "true";
      navStyle.textContent = `
        #nav .nav-back-apps{display:inline-flex;align-items:center;gap:6px;padding:9px 11px;border:1px solid rgba(255,255,255,.26);border-radius:8px;color:#fff;font-size:.78rem;font-weight:600;white-space:nowrap}
        #nav.solid .nav-back-apps{border-color:var(--border-strong);color:var(--text)}
        #nav .nav-back-apps:hover{background:rgba(255,255,255,.08)}
        @media(max-width:768px){#nav .nav-loginbtn,#nav .nav-right>.btn-primary{display:none}.nav-wordmark>span{display:none}}
      `;
      document.head.appendChild(navStyle);
      addedHeadNodes.push(navStyle);

      const scripts = Array.from(parsed.body.querySelectorAll("script"));
      scripts.forEach((script) => script.remove());
      host.replaceChildren(...Array.from(parsed.body.childNodes));

      for (const original of scripts) {
        const script = document.createElement("script");
        script.textContent = original.textContent;
        document.body.appendChild(script);
        addedScripts.push(script);
      }
      document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
      host.removeAttribute("aria-busy");
    };

    void load().catch((error: unknown) => {
      if (!cancelled) console.error("Corporate landing failed to initialize", error);
    });

    return () => {
      cancelled = true;
      addedScripts.forEach((script) => script.remove());
      addedHeadNodes.forEach((node) => node.remove());
      host.replaceChildren();
      document.body.style.overflow = previousOverflow;
      if (previousTheme === null) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", previousTheme);
    };
  }, []);

  return <div ref={hostRef} aria-busy="true" />;
}
