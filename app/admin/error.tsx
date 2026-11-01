"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="admin-notice is-error" role="alert">
      <h1>Admin data could not be loaded</h1>
      <p>No changes were made. Retry the read-only request.</p>
      <button className="admin-button" onClick={reset} type="button">
        Retry
      </button>
    </div>
  );
}
