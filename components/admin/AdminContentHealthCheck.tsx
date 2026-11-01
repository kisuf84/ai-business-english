"use client";

import { useState } from "react";
import { authenticatedFetch } from "../../lib/api/authenticatedFetch";

type HealthResult = {
  status: "available" | "missing" | "unavailable";
  detail: string;
  httpStatus?: number;
};

export default function AdminContentHealthCheck({ id }: { id: string }) {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/admin/content/check?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as HealthResult | null;
      setResult(payload || { status: "unavailable", detail: "No result returned." });
    } catch {
      setResult({ status: "unavailable", detail: "Health check failed." });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const tone = result.status === "available" ? "is-good" : result.status === "missing" ? "is-error" : "is-warning";
    return <button type="button" onClick={() => void check()} className={`admin-status admin-health-button ${tone}`} title={result.detail}>{result.status === "available" ? "Reference available" : result.status === "missing" ? "Reference missing" : "Check unavailable"}</button>;
  }

  return <button type="button" onClick={() => void check()} disabled={loading} className="admin-table-link admin-health-button" aria-live="polite">{loading ? "Checking…" : "Check reference"}</button>;
}
