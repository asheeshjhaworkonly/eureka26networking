"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  Globe,
  Check,
  Download,
  Share2,
  QrCode,
} from "lucide-react";
import { Avatar } from "./directory";
import { sectorName, statusName, type Profile } from "@/lib/core";
export default function ProfilePage({ id }: { id: string }) {
  const [profile, setProfile] = useState<Profile | null>(null),
    [own, setOwn] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [qr, setQr] = useState(""),
    [url, setUrl] = useState(""),
    [copied, setCopied] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/profiles/${id}`, { cache: "no-store" }).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d.profile;
      }),
      fetch("/api/profiles/me", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([p, me]) => {
        if (active) {
          setProfile(p);
          setOwn(me.profile?.id === id);
          setUrl(`${window.location.origin}/p/${id}`);
          setSaved(
            new URLSearchParams(window.location.search).get("saved") === "1",
          );
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    QRCode.toDataURL(`${window.location.origin}/p/${id}`, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#171713", light: "#ffffff" },
    })
      .then((q) => {
        if (active) setQr(q);
      })
      .catch(() => {
        if (active)
          setError(
            "Could not generate the QR. Share the profile link instead.",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: `${profile?.name} · Eureka 26`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError")
        setError("Could not share automatically. Copy the link shown below.");
    }
  }
  if (loading)
    return (
      <main className="container">
        <div className="empty-state">Loading this connection…</div>
      </main>
    );
  if (!profile)
    return (
      <main className="container">
        <div className="empty-state">
          <h1>That profile isn’t here.</h1>
          <p>{error}</p>
          <Link className="button yellow" href="/directory">
            Explore the directory <ArrowUpRight size={18} />
          </Link>
        </div>
      </main>
    );
  return (
    <main className="container profile-page">
      <Link className="back-link" href="/directory">
        <ArrowLeft size={17} /> Back to the directory
      </Link>
      {saved && (
        <div className="notice mint" role="status">
          <Check size={19} /> Your profile is live. Share your QR and make that
          first connection.
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <section className="profile-top">
        <div className="profile-person">
          <Avatar profile={profile} large />
          <div>
            <div className="eyebrow">
              EUREKA 26 · {profile.centre.toUpperCase()} ZONALS
            </div>
            <h1>{profile.name}</h1>
            <p>
              {profile.role} at <strong>{profile.company}</strong>
            </p>
            <span className="tag">{statusName(profile)}</span>
            <span className="profile-location">
              <MapPin size={15} />
              {profile.district}, {profile.state}
            </span>
          </div>
        </div>
        {own && (
          <Link className="button small" href="/profile/edit">
            Edit my profile <ArrowUpRight size={17} />
          </Link>
        )}
      </section>
      <div className="profile-layout">
        <div>
          <section className="about-card">
            <div className="eyebrow">THE IDEA THEY’RE BUILDING</div>
            <h2>
              {profile.company}{" "}
              <span className="tag yellow">{sectorName(profile)}</span>
            </h2>
            <p className="description">{profile.description}</p>
            <div className="detail-grid">
              {[
                ["Stage", profile.stage],
                ["Time building", profile.experience],
                ["Incorporated", profile.incorporated],
                ["Funded", profile.funded],
                ["Zonal centre", profile.centre],
                ["Eureka ID", profile.eurekaId],
              ].map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="company-links">
              {profile.website && (
                <a
                  className="button small"
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe size={16} /> Company website <ArrowUpRight size={16} />
                </a>
              )}
              {profile.companyLinkedin && (
                <a
                  className="button small"
                  href={profile.companyLinkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Company LinkedIn <ArrowUpRight size={16} />
                </a>
              )}
              {profile.companyEmail && (
                <a
                  className="button small"
                  href={`mailto:${profile.companyEmail}`}
                >
                  <Mail size={16} /> Company email
                </a>
              )}
            </div>
          </section>
          <section className="connect-card">
            <div className="eyebrow">MAKE THE FIRST MOVE</div>
            <h2>Say hello.</h2>
            <div className="connect-links">
              <a
                className="button yellow"
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                Connect on LinkedIn <ArrowUpRight size={19} />
              </a>
              <a className="button" href={`/api/profiles/${id}/contact`}>
                <Phone size={18} /> Save contact
              </a>
              <a className="button" href={`mailto:${profile.email}`}>
                <Mail size={18} /> Send an email
              </a>
            </div>
            <div className="contact-details">
              <span>{profile.email}</span>
              <span>{profile.phone}</span>
            </div>
            {profile.socials.length > 0 && (
              <div className="social-links">
                <h3>Communities & socials</h3>
                {profile.socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.label} <ArrowUpRight size={16} />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="qr-card lavender">
          <div className="eyebrow">
            <QrCode size={17} /> THE OFFLINE HELLO
          </div>
          <h2>
            One scan.
            <br />A new connection.
          </h2>
          <p>Show this at the zonals. Your whole profile is right here.</p>
          <div className="qr-image">
            {qr ? (
              <img
                src={qr}
                alt={`QR code linking to ${profile.name}'s Eureka 26 profile`}
              />
            ) : (
              <p>Generating QR…</p>
            )}
          </div>
          <strong>{profile.name}</strong>
          <span>{profile.company}</span>
          <button className="button yellow" onClick={() => void share()}>
            {copied ? <Check size={17} /> : <Share2 size={17} />}{" "}
            {copied ? "Link copied!" : "Share my profile"}
          </button>
          {qr && (
            <a className="button" href={qr} download={`eureka26-${id}-qr.png`}>
              <Download size={17} /> Download QR
            </a>
          )}
          <label className="qr-url">
            <span>Profile link</span>
            <input readOnly value={url} onFocus={(e) => e.target.select()} />
          </label>
          <p className="fine">Recipients sign in to view contact details.</p>
          <span className="qr-star">✳</span>
        </aside>
      </div>
      <p className="directory-footnote">
        Participant-submitted profile. Eureka qualification and company claims
        are not verified by this initiative.
      </p>
    </main>
  );
}
