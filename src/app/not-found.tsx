import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container">
      <div className="empty-state">
        <h1>Wrong turn. Good company.</h1>
        <p>This page doesn’t exist.</p>
        <Link className="button yellow" href="/directory">
          Back to the directory ↗
        </Link>
      </div>
    </main>
  );
}
