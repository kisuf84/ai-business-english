"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export function ProductExperienceFrame({ src, title }: { src: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const signingOut = useRef(false);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== "langslate:sign-out"
      ) {
        return;
      }
      if (signingOut.current) return;
      signingOut.current = true;

      try {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
        }
        window.location.assign("/auth");
      } catch {
        signingOut.current = false;
        window.alert("Could not sign out. Please try again.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      src={src}
      className="product-experience-frame"
      allow="fullscreen; microphone"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
