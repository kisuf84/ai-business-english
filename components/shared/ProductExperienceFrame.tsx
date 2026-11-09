"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export function ProductExperienceFrame({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      title={title}
      src={src}
      className="product-experience-frame"
      allow="fullscreen; microphone"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

export function ProductSignOutButton() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    if (pending) return;
    setPending(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      window.location.assign("/auth");
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("Could not sign out. Please try again.");
      setPending(false);
      return;
    }
    window.location.assign("/auth");
  };

  return (
    <div className="product-signout-control">
      {error ? <span role="alert" className="product-signout-error">{error}</span> : null}
      <button type="button" onClick={() => void signOut()} disabled={pending} aria-label="Sign out">
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
