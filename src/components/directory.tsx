"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Dialog } from "./dialog";
import {
  ArrowUpRight,
  Download,
  Search,
  SlidersHorizontal,
  X,
  Plus,
  Users,
  MapPin,
  RotateCw,
  Phone,
  ExternalLink,
  ArrowDownUp,
} from "lucide-react";
import {
  filterProfiles,
  filterValue,
  sectorName,
  statusName,
  type Profile,
  type Filters,
} from "@/lib/core";
export function Avatar({
  profile,
  large = false,
}: {
  profile: Profile;
  large?: boolean;
}) {
  return (
    <span className={`avatar ${large ? "large" : ""}`}>
      {profile.photo ? (
        <img
          src={`/api/profiles/${profile.id}/photo?v=${encodeURIComponent(profile.updatedAt)}`}
          alt={`${profile.name}'s profile photo`}
        />
      ) : (
        profile.name
          .split(/\s+/)
          .slice(0, 2)
          .map((s) => s[0])
          .join("")
          .toUpperCase()
      )}
    </span>
  );
}
function CentreTag({ centre }: { centre: string }) {
  return (
    <span className={`tag centre-${centre.toLowerCase()}`}>
      <span className="tag-dot" />
      {centre}
    </span>
  );
}
const FILTER_KEYS: [keyof Filters, string][] = [
  ["centre", "Zonal centre"],
  ["sector", "Sector"],
  ["stage", "Company stage"],
  ["status", "Current situation"],
  ["state", "State"],
  ["district", "District / city"],
  ["funded", "Funded"],
  ["incorporated", "Incorporated"],
  ["role", "Role"],
  ["experience", "Time building"],
];
export default function Directory() {
  const [profiles, setProfiles] = useState<Profile[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filters, setFilters] = useState<Filters>({}),
    [draft, setDraft] = useState<Filters>({}),
    [open, setOpen] = useState(false),
    [sort, setSort] = useState("Newest first");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profiles", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfiles(data.profiles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load directory.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const shown = useMemo(() => {
    const list = filterProfiles(profiles, query, filters);
    return sort === "A–Z"
      ? list.sort((a, b) => a.name.localeCompare(b.name))
      : list;
  }, [profiles, query, filters, sort]);
  const active = Object.entries(filters).filter(([, v]) => v);
  const sectors = new Set(profiles.map(sectorName)).size;
  return (
    <main className="container directory">
      <div className="eyebrow">
        <span className="live-dot" /> THE ZONAL ROLL CALL
      </div>
      <div className="page-heading">
        <div>
          <h1>
            Your next connection
            <br />
            is <span className="highlight">in here.</span>
          </h1>
          <p>
            The people. The ideas. The ones building something, just like you.
          </p>
        </div>
        <Link className="button yellow" href="/profile/edit">
          <Plus size={20} /> Add / edit my profile
        </Link>
      </div>
      <section className="stats" aria-label="Network statistics">
        <div className="stat yellow">
          <Users />
          <strong>{loading || error ? "—" : profiles.length}</strong>
          <span>PEOPLE IN THE NETWORK</span>
        </div>
        <div className="stat">
          <MapPin />
          <strong>3</strong>
          <span>ZONAL CENTRES</span>
        </div>
        <div className="stat lavender">
          <ArrowUpRight />
          <strong>{loading || error ? "—" : sectors}</strong>
          <span>SECTORS & BIG IDEAS</span>
        </div>
        <div className="stat-note">
          <span className="mini-star">✳</span>
          <p>
            One introduction
            <br />
            can change everything.
          </p>
        </div>
      </section>
      <div className="directory-tools">
        <div className="search-wrap">
          <Search size={22} />
          <input
            aria-label="Search all profile information"
            placeholder="Search names, companies, sectors, locations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          className={`button filter-button ${active.length ? "yellow" : ""}`}
          onClick={() => {
            setDraft({ ...filters });
            setOpen(true);
          }}
        >
          <SlidersHorizontal size={19} /> Filters
          {active.length > 0 && (
            <span className="count-badge">{active.length}</span>
          )}
        </button>
        <Link className="button download-button" href="/download">
          <Download size={19} /> Download full sheet
        </Link>
      </div>
      {active.length > 0 && (
        <div className="active-filters">
          {active.map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilters((f) => ({ ...f, [k]: "" }))}
            >
              {FILTER_KEYS.find(([key]) => key === k)?.[1]}: {v}
              <X size={14} />
            </button>
          ))}
          <button className="text-button" onClick={() => setFilters({})}>
            Clear all
          </button>
        </div>
      )}
      <div className="list-heading">
        <div>
          <strong>THE DIRECTORY</strong>
          <span>
            {loading
              ? "Loading…"
              : `${shown.length} of ${profiles.length} people`}
          </span>
        </div>
        <div className="list-options">
          <button
            className="icon-button"
            onClick={() => void load()}
            aria-label="Refresh directory"
            disabled={loading}
          >
            <RotateCw size={17} />
          </button>
          <ArrowDownUp size={15} />
          <select
            aria-label="Sort directory"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Newest first</option>
            <option>A–Z</option>
          </select>
        </div>
      </div>
      {error ? (
        <div className="empty-state error-state" role="alert">
          <h2>The directory couldn’t load.</h2>
          <p>{error}</p>
          <button className="button yellow" onClick={() => void load()}>
            Try again <RotateCw size={18} />
          </button>
        </div>
      ) : loading ? (
        <div className="table-loading" aria-live="polite">
          {[1, 2, 3].map((n) => (
            <div className="skeleton-row" key={n}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            {profiles.length ? <Search size={34} /> : <Users size={34} />}
          </span>
          <h2>
            {profiles.length
              ? "No matches. Keep exploring."
              : "The first hello starts with you."}
          </h2>
          <p>
            {profiles.length
              ? "Try a different search or remove a filter."
              : "Add your profile, then share the network with your zonal WhatsApp group."}
          </p>
          {profiles.length ? (
            <button
              className="button yellow"
              onClick={() => {
                setQuery("");
                setFilters({});
              }}
            >
              Reset search & filters
            </button>
          ) : (
            <Link className="button yellow" href="/profile/edit">
              Create my profile <ArrowUpRight size={20} />
            </Link>
          )}
        </div>
      ) : (
        <div className="directory-table">
          <div className="table-head">
            <span>PERSON / COMPANY</span>
            <span>SECTOR / STAGE</span>
            <span>ZONAL CENTRE</span>
            <span>LET’S CONNECT ↗</span>
          </div>
          {shown.map((p) => (
            <article className="person-row" key={p.id}>
              <Link className="person-identity" href={`/p/${p.id}`}>
                <Avatar profile={p} />
                <div>
                  <h3>
                    {p.name}
                    <ArrowUpRight size={15} />
                  </h3>
                  <p>{p.company}</p>
                  <small>
                    {p.role} · {statusName(p)}
                  </small>
                </div>
              </Link>
              <div className="person-sector">
                <strong>{sectorName(p)}</strong>
                <span>{p.stage}</span>
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer">
                    Company website <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className="person-location">
                <CentreTag centre={p.centre} />
                <small>
                  {p.district}, {p.state}
                </small>
              </div>
              <div className="person-actions">
                <a
                  className="button small"
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Connect <ArrowUpRight size={16} />
                </a>
                <a
                  className="icon-button bordered"
                  href={`/api/profiles/${p.id}/contact`}
                  aria-label={`Save ${p.name}'s contact`}
                >
                  <Phone size={18} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="directory-footnote">
        Profiles are shared by participants. Company details are self-reported.
      </p>
      {open && (
        <Dialog
          className="filter-modal"
          labelledBy="filter-title"
          onClose={() => setOpen(false)}
        >
          <div className="modal-heading">
            <div>
              <div className="eyebrow">MAKE IT YOUR NETWORK</div>
              <h2 id="filter-title">Find your people.</h2>
            </div>
            <button
              className="icon-button bordered"
              autoFocus
              aria-label="Close filters"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </div>
          <div className="filter-grid">
            {FILTER_KEYS.map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  value={draft[key] || ""}
                  onChange={(e) =>
                    setDraft((f) => ({ ...f, [key]: e.target.value }))
                  }
                >
                  <option value="">All {label.toLowerCase()}</option>
                  {Array.from(new Set(profiles.map((p) => filterValue(p, key))))
                    .sort()
                    .map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                </select>
              </label>
            ))}
          </div>
          <div className="modal-footer">
            <button className="text-button" onClick={() => setDraft({})}>
              Reset filters
            </button>
            <button
              className="button yellow"
              onClick={() => {
                setFilters(draft);
                setOpen(false);
              }}
            >
              Apply filters <ArrowUpRight size={18} />
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
