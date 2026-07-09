"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "../../lib/api/authenticatedFetch";
import type { LessonRecord } from "../../types/lesson";

export default function DashboardLessonsStatTile() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadCount = async () => {
      try {
        const response = await authenticatedFetch("/api/lesson/list", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as LessonRecord[] | null;
        if (!active) return;
        setCount(response.ok && Array.isArray(payload) ? payload.length : 0);
      } catch {
        if (active) setCount(0);
      }
    };

    void loadCount();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="stat-tile">
      <div className="icon font-mono text-[10px] font-bold bg-[image:var(--grad-aurora)] text-[#0a0a14]">
        LE
      </div>
      <div className="v">{count === null ? "—" : count}</div>
      <div className="l">Lessons created</div>
      <span className="delta">Generator</span>
    </div>
  );
}
