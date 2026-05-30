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
    <h1 className="lumen-heading m-0 text-balance text-[34px] leading-[1.02] sm:text-[44px] lg:text-[58px]">
      {name ? `Welcome back, ${name}` : "Welcome back"}
    </h1>
  );
}
