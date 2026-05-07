"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

function resolvePreferredName(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return "";
  const preferred = metadata.preferred_name;
  if (typeof preferred === "string" && preferred.trim().length > 0) {
    return preferred.trim();
  }
  const fullName = metadata.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName.trim();
  }
  return "";
}

export default function PersonalizedGreeting() {
  const [name, setName] = useState("");

  useEffect(() => {
    let active = true;

    const loadName = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      setName(resolvePreferredName(data.user.user_metadata));
    };

    void loadName();
    return () => {
      active = false;
    };
  }, []);

  return (
    <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.035em] text-[var(--ink)] sm:text-[32px] lg:text-[36px]">
      {name ? `Welcome back, ${name}` : "Welcome back"}
    </h1>
  );
}
