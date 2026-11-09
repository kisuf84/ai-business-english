"use client";

import { useCallback, type SyntheticEvent } from "react";
import type { LangslateProduct } from "../../lib/langslateDomains.mjs";
import { getProductLearningPath, getProductAuthHref } from "../../lib/langslateDomains.mjs";

export default function PublicProductLandingFrame({
  product,
  src,
  title,
}: {
  product: LangslateProduct;
  src: string;
  title: string;
}) {
  const handleLoad = useCallback((event: SyntheticEvent<HTMLIFrameElement>) => {
    const frameWindow = event.currentTarget.contentWindow;
    if (!frameWindow) return;

    const destination = getProductLearningPath(product);
    if (!destination) return;
    const authUrl = getProductAuthHref(product);
    const goToAuth = () => frameWindow.top?.location.assign(authUrl);
    const frameGlobals = frameWindow as unknown as Record<string, unknown>;
    const unavailable = () => {
      const showToast = frameGlobals.showToast;
      if (typeof showToast === "function") {
        (showToast as (message: string, icon?: string) => void)(
          "This option is not available yet.",
          "ℹ️"
        );
      }
    };

    if (product === "flow") frameGlobals.enterPractice = goToAuth;
    if (product === "365") {
      frameGlobals.enterCourse = goToAuth;
      frameGlobals.handleLogin = goToAuth;
      frameGlobals.handleSignup = goToAuth;
      frameGlobals.handleGoogleAuth = goToAuth;
      frameGlobals.handleDemoAccess = unavailable;
      frameGlobals.handlePlanSelect = unavailable;
      frameGlobals.useDemoCode = unavailable;

      const openModal = frameGlobals.openModal;
      if (typeof openModal === "function") {
        frameGlobals.openModal = (modal: unknown, ...args: unknown[]) => {
          if (modal === "loginModal" || modal === "signupModal") {
            goToAuth();
            return;
          }
          if (modal === "demoModal") {
            unavailable();
            return;
          }
          (openModal as (...values: unknown[]) => void)(modal, ...args);
        };
      }
    }
    if (product === "academy") {
      frameGlobals.handleLogin = goToAuth;
      frameGlobals.handleSignup = goToAuth;
      frameGlobals.handleGoogleAuth = goToAuth;
    }

    const frameDocument = frameWindow.document;
    frameDocument.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element | null;
        if (!target || typeof target.closest !== "function") return;
        const clickable = target.closest("a,button,[onclick]");
        if (!clickable) return;
        const action = `${clickable.getAttribute("onclick") || ""} ${clickable.getAttribute("href") || ""}`;
        const shouldAuthenticate = product === "academy"
          ? /apps\/academy\/platform|handle(Login|Signup|GoogleAuth)/i.test(action)
          : product === "flow"
            ? /enterPractice/i.test(action)
            : /enterCourse/i.test(action);
        if (!shouldAuthenticate) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        goToAuth();
      },
      true
    );

    if (product === "academy") {
      frameDocument.addEventListener(
        "submit",
        (event) => {
          const target = event.target as HTMLFormElement | null;
          if (!target || target.tagName !== "FORM") return;
          if (!target.querySelector('input[type="password"], input[type="email"]')) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          goToAuth();
        },
        true
      );
    }
  }, [product]);

  return (
    <main className="min-h-dvh w-full overflow-hidden bg-white">
      <iframe
        title={title}
        src={src}
        onLoad={handleLoad}
        className="block min-h-dvh w-full border-0 bg-white"
        allow="microphone; autoplay; clipboard-read; clipboard-write"
      />
    </main>
  );
}
