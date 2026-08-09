"use client";

import { useState } from "react";

export default function LessonThumbnail({
  src,
  title,
  category,
}: {
  src: string;
  title: string;
  category: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]">
      {failed ? (
        <div className="grid h-full w-full place-items-center bg-[image:var(--grad-aurora)]">
          <span className="px-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#0a0a14]">
            {category}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={`${title} lesson preview`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
