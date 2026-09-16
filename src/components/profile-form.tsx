"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Dialog } from "./dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Camera,
  Plus,
  X,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import {
  CENTRES,
  STATUSES,
  SECTORS,
  STAGES,
  EXPERIENCES,
  emptyProfile,
  profileSchema,
  wordCount,
  type ProfileInput,
  type Profile,
} from "@/lib/core";
const STEPS = [
  "You, the person",
  "Your company / idea",
  "The finer details",
  "Links & publish",
];
const STEP_FIELDS = [
  ["name", "role", "email", "phone", "linkedin", "status", "statusOther"],
  [
    "company",
    "companyEmail",
    "companyLinkedin",
    "website",
    "sector",
    "sectorOther",
    "stage",
    "description",
  ],
  ["incorporated", "funded", "district", "state", "centre", "experience"],
  ["socials", "consent"],
];
type Errors = Record<string, string[]>;
export default function ProfileForm() {
  const router = useRouter(),
    { user } = useUser();
  const [values, setValues] = useState<ProfileInput>({ ...emptyProfile }),
    [step, setStep] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Errors>({}),
    [saving, setSaving] = useState(false),
    [existing, setExisting] = useState<Profile | null>(null),
    [photo, setPhoto] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [consent, setConsent] = useState(false),
    [deleteOpen, setDeleteOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/profiles/me", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (active) {
          if (d.profile) {
            setExisting(d.profile);
            setValues(d.profile);
            setConsent(true);
          } else {
            setValues((v) => ({
              ...v,
              name: user?.fullName || "",
              email: user?.primaryEmailAddress?.emailAddress || "",
            }));
          }
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.fullName, user?.primaryEmailAddress?.emailAddress]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function change<K extends keyof ProfileInput>(
    key: K,
    value: ProfileInput[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: [] }));
  }
  function field(
    key: keyof ProfileInput,
    label: string,
    options?: {
      type?: string;
      placeholder?: string;
      choices?: readonly string[];
      required?: boolean;
      hint?: string;
    },
  ) {
    const opts = options || {};
    return (
      <label
        className={`field ${errors[key]?.length ? "field-error" : ""}`}
        key={key}
        htmlFor={key}
      >
        <span>
          {label}
          {opts.required && <b> *</b>}
        </span>
        {opts.choices ? (
          <select
            id={key}
            value={String(values[key])}
            onChange={(e) => change(key, e.target.value as never)}
            aria-invalid={Boolean(errors[key]?.length)}
            aria-describedby={errors[key]?.length ? `${key}-error` : undefined}
          >
            {opts.choices.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        ) : (
          <input
            id={key}
            type={opts.type || "text"}
            value={String(values[key])}
            placeholder={opts.placeholder}
            onChange={(e) => change(key, e.target.value as never)}
            maxLength={
              opts.type === "url" ? 500 : opts.type === "email" ? 254 : 150
            }
            aria-required={opts.required}
            aria-invalid={Boolean(errors[key]?.length)}
            aria-describedby={errors[key]?.length ? `${key}-error` : undefined}
            autoComplete={
              key === "name"
                ? "name"
                : key === "email"
                  ? "email"
                  : key === "phone"
                    ? "tel"
                    : undefined
            }
          />
        )}
        <small id={`${key}-error`}>
          {errors[key]?.[0] || opts.hint || " "}
        </small>
      </label>
    );
  }
  function validateCurrent() {
    const result = profileSchema.safeParse({ ...values, consent });
    if (result.success) return true;
    const all = result.error.flatten().fieldErrors as Errors;
    const current = Object.fromEntries(
      Object.entries(all).filter(([k]) => STEP_FIELDS[step].includes(k)),
    );
    setErrors(current);
    return Object.keys(current).length === 0;
  }
  function move(next: number) {
    setStep(next);
    setErrors({});
    formRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }
  async function save() {
    setError("");
    const parsed = profileSchema.safeParse({ ...values, consent });
    if (!parsed.success) {
      const all = parsed.error.flatten().fieldErrors as Errors;
      setErrors(all);
      const badStep = STEP_FIELDS.findIndex((fields) =>
        fields.some((k) => all[k]?.length),
      );
      setStep(Math.max(0, badStep));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error);
      }
      setExisting({
        ...parsed.data,
        id: data.id,
        photo: Boolean(existing?.photo),
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (photo) {
        const body = new FormData();
        body.set("photo", photo);
        const r = await fetch(`/api/profiles/${data.id}/photo`, {
          method: "POST",
          body,
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
      }
      router.push(`/p/${data.id}?saved=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    setSaving(true);
    try {
      const res = await fetch("/api/profiles/me", { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      router.push("/directory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove profile.");
    } finally {
      setSaving(false);
      setDeleteOpen(false);
    }
  }
  if (loading)
    return (
      <main className="container form-page">
        <div className="empty-state">Loading your profile…</div>
      </main>
    );
  return (
    <main className="container form-page">
      <Link className="back-link" href="/directory">
        <ArrowLeft size={17} /> Back to the directory
      </Link>
      <div className="form-intro">
        <div className="eyebrow">A FACE. AN IDEA. A FIRST HELLO.</div>
        <h1>
          {existing ? "Make it" : "Let’s make it"}{" "}
          <span className="highlight">official-ish.</span>
        </h1>
        <p>
          {existing
            ? "Update your story. Your profile link and QR stay the same."
            : "Create your participant profile. Give your next connection something to remember."}
        </p>
      </div>
      <div className="form-layout">
        <aside className="form-sidebar">
          <div className="step-count">
            YOUR PROFILE <span>{step + 1} / 4</span>
          </div>
          <ol>
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={i === step ? "selected" : i < step ? "complete" : ""}
              >
                <span>
                  {i < step ? (
                    <Check size={16} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <strong>{s}</strong>
              </li>
            ))}
          </ol>
          <div className="sidebar-note">
            <span>✳</span>
            <p>
              Good connections
              <br />
              start with a good intro.
            </p>
          </div>
          <p className="fine">
            * Required fields
            <br />
            You can edit or remove your profile later.
          </p>
          {existing && (
            <Link className="back-link" href={`/p/${existing.id}`}>
              View my profile <ArrowUpRight size={16} />
            </Link>
          )}
        </aside>
        <form
          className="profile-form"
          ref={formRef}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              if (validateCurrent()) move(step + 1);
            } else void save();
          }}
        >
          <div className="form-section-heading">
            <span>0{step + 1}</span>
            <div>
              <h2>{STEPS[step]}</h2>
              <p>
                {
                  [
                    "Founder, teammate, investor — tell us who you are.",
                    "Still an idea? That counts. Tell us what you’re building.",
                    "Help the right people find you.",
                    "Bring your links. Then say hello to the network.",
                  ][step]
                }
              </p>
            </div>
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          {step === 0 && (
            <>
              <div className="photo-field">
                <div className="photo-preview">
                  {preview ? (
                    <img src={preview} alt="Selected profile photo" />
                  ) : existing?.photo ? (
                    <img
                      src={`/api/profiles/${existing.id}/photo?v=${existing.updatedAt}`}
                      alt="Your current photo"
                    />
                  ) : (
                    <Camera size={28} />
                  )}
                </div>
                <div>
                  <label className="button small photo-upload">
                    {photo ? "Change photo" : "Upload your photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f && f.size > 3 * 1024 * 1024) {
                          setError("Choose a photo under 3 MB.");
                          e.target.value = "";
                          return;
                        }
                        if (f) {
                          setError("");
                          setPhoto(f);
                          setPreview(URL.createObjectURL(f));
                        }
                      }}
                    />
                  </label>
                  <p className="fine">
                    JPG, PNG or WebP · up to 3 MB · optional
                  </p>
                  {photo && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPreview("");
                      }}
                    >
                      Cancel photo change
                    </button>
                  )}
                </div>
              </div>
              <div className="field-grid">
                {field("name", "Your full name", {
                  required: true,
                  placeholder: "What should we call you?",
                })}
                {field("role", "Your role in the company", {
                  required: true,
                  placeholder: "Founder, co-founder, team member…",
                })}
                {field("status", "Currently you are…", { choices: STATUSES })}
                {values.status === "Other" &&
                  field("statusOther", "Tell us more", { required: true })}
                {field("email", "Your email", {
                  type: "email",
                  required: true,
                  placeholder: "hello@example.com",
                })}
                {field("phone", "Your phone number", {
                  type: "tel",
                  required: true,
                  placeholder: "+91 98765 43210",
                  hint: "Include the country code for easier contact saving.",
                })}
                {field("linkedin", "Your LinkedIn profile", {
                  type: "url",
                  required: true,
                  placeholder: "https://www.linkedin.com/in/your-name",
                })}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="field-grid">
                {field("company", "Company / idea name", {
                  required: true,
                  placeholder: "The thing you’re building",
                })}
                {field("companyEmail", "Company email", {
                  type: "email",
                  placeholder: "team@example.com",
                })}
                {field("website", "Company website", {
                  type: "url",
                  placeholder: "https://yourcompany.com",
                })}
                {field("companyLinkedin", "Company LinkedIn", {
                  type: "url",
                  placeholder: "https://www.linkedin.com/company/…",
                })}
                {field("sector", "Company sector", { choices: SECTORS })}
                {values.sector === "Other" &&
                  field("sectorOther", "Your sector", { required: true })}
                {field("stage", "Company stage", { choices: STAGES })}
              </div>
              <label
                className={`field ${errors.description?.length ? "field-error" : ""}`}
                htmlFor="description"
              >
                <span>
                  Your company in a nutshell <b>*</b>
                  <small
                    className={
                      wordCount(values.description) > 50
                        ? "word-limit over"
                        : "word-limit"
                    }
                  >
                    {wordCount(values.description)} / 50 words
                  </small>
                </span>
                <textarea
                  id="description"
                  rows={5}
                  maxLength={1200}
                  value={values.description}
                  placeholder="What are you building, who is it for, and why does it matter?"
                  onChange={(e) => change("description", e.target.value)}
                  aria-invalid={Boolean(errors.description?.length)}
                />
                <small>
                  {errors.description?.[0] ||
                    "Keep it simple. Keep it under 50 words."}
                </small>
              </label>
            </>
          )}
          {step === 2 && (
            <>
              <div className="notice mint">
                <MapNote />
                These details describe your startup or company, rather than your
                current personal location.
              </div>
              <div className="field-grid">
                {field("centre", "Where are you pitching?", {
                  choices: CENTRES,
                  hint: "Mumbai (Bombay), Delhi, or Bengaluru (Bangalore).",
                })}
                {field(
                  "experience",
                  "How long have you been working on this?",
                  { choices: EXPERIENCES },
                )}
                {field("district", "Company district / city", {
                  required: true,
                  placeholder: "e.g. Pune",
                })}
                {field("state", "Company state / region", {
                  required: true,
                  placeholder: "e.g. Maharashtra",
                })}
                {field("incorporated", "Is the company incorporated?", {
                  choices: ["No", "Yes"],
                })}
                {field("funded", "Is the company funded?", {
                  choices: ["No", "Yes"],
                })}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="social-intro">
                <strong>Your company’s communities & socials</strong>
                <p>
                  WhatsApp, Instagram, Discord, or wherever your people hang
                  out. Up to 8 links.
                </p>
              </div>
              {values.socials.map((s, i) => (
                <div className="social-row" key={i}>
                  <label className="field">
                    <span>Platform / community</span>
                    <input
                      value={s.label}
                      maxLength={60}
                      placeholder="e.g. Instagram"
                      onChange={(e) =>
                        change(
                          "socials",
                          values.socials.map((x, j) =>
                            j === i ? { ...x, label: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Link</span>
                    <input
                      type="url"
                      value={s.url}
                      maxLength={500}
                      placeholder="https://…"
                      onChange={(e) =>
                        change(
                          "socials",
                          values.socials.map((x, j) =>
                            j === i ? { ...x, url: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button bordered"
                    aria-label={`Remove social link ${i + 1}`}
                    onClick={() =>
                      change(
                        "socials",
                        values.socials.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {errors.socials?.length > 0 && (
                <p className="error-text">{errors.socials[0]}</p>
              )}
              {values.socials.length < 8 && (
                <button
                  className="button small"
                  type="button"
                  onClick={() =>
                    change("socials", [
                      ...values.socials,
                      { label: "", url: "" },
                    ])
                  }
                >
                  <Plus size={17} /> Add a link
                </button>
              )}
              <div className="publish-note yellow">
                <h3>Your profile. Your choice.</h3>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setErrors((v) => ({ ...v, consent: [] }));
                    }}
                  />
                  <span>
                    I agree to share my profile, photo, email, phone number, and
                    links with signed-in network members, and include these
                    details in downloadable directory snapshots. I understand
                    previously downloaded copies cannot be recalled.
                  </span>
                </label>
                {errors.consent?.length > 0 && (
                  <p className="error-text">{errors.consent[0]}</p>
                )}
                <Link href="/privacy" target="_blank">
                  Read the privacy & community rules <ArrowUpRight size={14} />
                </Link>
              </div>
            </>
          )}
          <div className="form-bottom">
            {step > 0 ? (
              <button
                className="button"
                type="button"
                disabled={saving}
                onClick={() => move(step - 1)}
              >
                <ArrowLeft size={17} /> Back
              </button>
            ) : (
              <span className="fine">
                A few minutes. A lot of possibilities.
              </span>
            )}
            <button type="submit" className="button yellow" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle className="spin" size={18} /> Saving…
                </>
              ) : step < 3 ? (
                <>
                  Continue <ArrowRight size={18} />
                </>
              ) : (
                <>
                  {existing ? "Save changes" : "Publish my profile"}{" "}
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      {existing && (
        <div className="danger-zone">
          <span>
            Want to leave the directory? Remove your profile and photo.
          </span>
          <button className="text-button" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={15} /> Remove my profile
          </button>
        </div>
      )}
      {deleteOpen && (
        <Dialog
          className="confirm-modal"
          labelledBy="delete-title"
          onClose={() => {
            if (!saving) setDeleteOpen(false);
          }}
        >
          <h2 id="delete-title">Remove your profile?</h2>
          <p>
            Your profile and photo will leave the directory. Previously
            downloaded CSV copies remain with their recipients. Your login
            account remains available.
          </p>
          <div>
            <button
              className="button"
              autoFocus
              disabled={saving}
              onClick={() => setDeleteOpen(false)}
            >
              Keep my profile
            </button>
            <button
              className="button orange"
              disabled={saving}
              onClick={() => void remove()}
            >
              Remove profile
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
function MapNote() {
  return <span aria-hidden="true">↗</span>;
}
