"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container">
      <div className="empty-state">
        <h1>Something got interrupted.</h1>
        <p>Please try loading this page again.</p>
        <button className="button yellow" onClick={reset}>
          Try again ↗
        </button>
      </div>
    </main>
  );
}
