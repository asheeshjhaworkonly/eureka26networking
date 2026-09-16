"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Check,
  FileSpreadsheet,
  Clock,
  LockKeyhole,
  LoaderCircle,
} from "lucide-react";
export default function DownloadPage() {
  const [status, setStatus] = useState<{
      paymentGateEnabled: boolean;
      unlocked: boolean;
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [pledge, setPledge] = useState(false);
  useEffect(() => {
    fetch("/api/export/status", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setStatus(d);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function download() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/export", { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const blob = await res.blob(),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] || "eureka26-directory.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="container download-page">
      <Link className="back-link" href="/directory">
        <ArrowLeft size={17} /> Back to the directory
      </Link>
      <div className="download-layout">
        <section>
          <div className="eyebrow">TAKE THE NETWORK WITH YOU</div>
          <h1>
            Great connections.
            <br />
            <span className="highlight">In one sheet.</span>
          </h1>
          <p className="intro">
            A complete directory snapshot. Open it in Excel or Google Sheets,
            find your people, and keep in touch beyond the zonals.
          </p>
          <div className="export-benefits">
            {[
              {
                icon: FileSpreadsheet,
                title: "The complete picture",
                text: "Every published participant profile, company detail, contact, and social link. CSV format, ready for Excel.",
              },
              {
                icon: Clock,
                title: "Fresh at the moment you download",
                text: "Every download contains the latest directory. The saved file is a snapshot and does not update itself.",
              },
              {
                icon: LockKeyhole,
                title: "For this network, with care",
                text: "Use it for relevant connections. Please don’t publish, resell, bulk-message, or forward the directory outside the network.",
              },
            ].map((b) => (
              <div key={b.title}>
                <b.icon size={23} />
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              </div>
            ))}
          </div>
          {status?.paymentGateEnabled && (
            <div className="why-card">
              <h2>Why a one-time ₹9?</h2>
              <p>
                Participants put effort into reaching the zonals and choosing to
                share their information. The planned ₹9 fee is a small
                commitment to handle that shared directory responsibly, and
                helps cover the cost of building and running this tool.
              </p>
              <p>
                A fee cannot prevent leaks. Respecting the people in the sheet
                is what matters. Once paid, your account will be able to
                download newer snapshots without paying again.
              </p>
            </div>
          )}
        </section>
        <aside className="export-card yellow">
          <span className="export-card-icon">
            <FileSpreadsheet size={46} />
          </span>
          <div className="eyebrow">EUREKA 26 DIRECTORY</div>
          <h2>
            Your network.
            <br />
            Ready to go.
          </h2>
          <div className="export-line">
            <span>Format</span>
            <strong>.CSV · Excel-compatible</strong>
          </div>
          <div className="export-line">
            <span>Includes</span>
            <strong>All published profiles</strong>
          </div>
          <div className="export-line">
            <span>Updated</span>
            <strong>At download time</strong>
          </div>
          {status?.paymentGateEnabled ? (
            status.unlocked ? (
              <div className="testing-banner">
                <Check size={17} /> Your account already has access.
              </div>
            ) : (
              <div className="testing-banner">
                <strong>ONE-TIME ACCESS · ₹9</strong>
                <p>
                  Checkout is not available yet. Downloads will open once
                  payment is enabled.
                </p>
              </div>
            )
          ) : !status ? (
            <p aria-live="polite">Checking download access…</p>
          ) : null}
          <label className="consent export-pledge">
            <input
              type="checkbox"
              checked={pledge}
              onChange={(e) => setPledge(e.target.checked)}
            />
            <span>
              I’ll use this directory for relevant networking and keep it out of
              the public domain.
            </span>
          </label>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <button
            className="button dark"
            disabled={!status?.unlocked || !pledge || busy}
            onClick={() => void download()}
          >
            {busy ? (
              <LoaderCircle size={19} className="spin" />
            ) : (
              <Download size={19} />
            )}{" "}
            {busy
              ? "Preparing fresh snapshot…"
              : done
                ? "Download latest snapshot again"
                : "Download full CSV"}
          </button>
          {done && (
            <p className="download-success" role="status">
              <Check size={16} /> Download started. Your file is a fixed
              snapshot.
            </p>
          )}
          <p className="fine">
            Profile photos are linked, rather than embedded. Photo links require
            login.
          </p>
          <Link href="/privacy">
            Privacy & community rules <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
