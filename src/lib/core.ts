import { z } from "zod";

export const CENTRES = ["Mumbai", "Delhi", "Bengaluru"] as const;
export const STATUSES = [
  "Student",
  "Working professional",
  "Corporate",
  "Full-time founder",
  "Investor",
  "Other",
] as const;
export const SECTORS = [
  "AI & ML",
  "Agritech",
  "Climate & energy",
  "Consumer & D2C",
  "Deeptech",
  "Education",
  "Fintech",
  "Food & beverages",
  "Healthcare",
  "Manufacturing",
  "Mobility",
  "SaaS",
  "Social impact",
  "Other",
] as const;
export const STAGES = [
  "Idea",
  "Prototype",
  "MVP",
  "Early revenue",
  "Growth",
  "Scaling",
] as const;
export const EXPERIENCES = [
  "Under 6 months",
  "6–12 months",
  "1–2 years",
  "2–5 years",
  "5+ years",
] as const;
const text = (max = 150) => z.string().trim().max(max);
const optionalEmail = z.union([z.literal(""), z.email().max(254)]);
export const safeUrl = (value: string) => {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.toString()
      : null;
  } catch {
    return null;
  }
};
export function sameOrigin(
  origin: string | null,
  host: string,
  protocol: string,
) {
  try {
    if (!origin || !["http", "https"].includes(protocol)) return false;
    const actual = new URL(origin);
    return (
      !actual.username &&
      !actual.password &&
      actual.origin === new URL(`${protocol}://${host}`).origin
    );
  } catch {
    return false;
  }
}
const url = text(500).refine(
  (v) => !v || Boolean(safeUrl(v)),
  "Use a full https:// or http:// link",
);
const linkedin = url.refine((v) => {
  if (!v) return true;
  const parsed = safeUrl(v);
  return Boolean(
    parsed && /(^|\.)linkedin\.com$/i.test(new URL(parsed).hostname),
  );
}, "Use a linkedin.com link");
export const wordCount = (s: string) =>
  s.trim() ? s.trim().split(/\s+/u).length : 0;
export const profileSchema = z
  .object({
    name: text(100).min(2, "Enter your full name"),
    role: text(100).min(1, "Enter your role"),
    email: z.email().max(254),
    phone: text(30).refine(
      (v) =>
        /^\+?[\d\s()-]{7,30}$/.test(v) &&
        v.replace(/\D/g, "").length >= 7 &&
        v.replace(/\D/g, "").length <= 15,
      "Enter 7–15 digits, including your country code",
    ),
    linkedin: linkedin.refine((v) => Boolean(v), "Add your LinkedIn profile"),
    status: z.enum(STATUSES),
    statusOther: text(100),
    company: text(150).min(1, "Enter your company or idea name"),
    companyEmail: optionalEmail,
    companyLinkedin: linkedin,
    website: url,
    sector: z.enum(SECTORS),
    sectorOther: text(100),
    stage: z.enum(STAGES),
    incorporated: z.enum(["Yes", "No"]),
    funded: z.enum(["Yes", "No"]),
    district: text(100).min(1, "Enter your district or city"),
    state: text(100).min(1, "Enter your state"),
    centre: z.enum(CENTRES),
    experience: z.enum(EXPERIENCES),
    description: text(1200)
      .min(1, "Describe your company or idea")
      .refine((v) => wordCount(v) <= 50, "Keep your description to 50 words"),
    socials: z
      .array(
        z.object({
          label: text(60).min(1),
          url: url.refine((v) => Boolean(v), "Add a link"),
        }),
      )
      .max(8),
    consent: z.literal(true, {
      error: "Consent is required to publish your profile",
    }),
  })
  .superRefine((v, ctx) => {
    for (const [field, other] of [
      ["status", "statusOther"],
      ["sector", "sectorOther"],
    ] as const)
      if (v[field] === "Other" && !v[other])
        ctx.addIssue({
          code: "custom",
          path: [other],
          message: "Please specify",
        });
  });
export type ProfileInput = z.infer<typeof profileSchema>;
export type Profile = ProfileInput & {
  id: string;
  photo: boolean;
  createdAt: string;
  updatedAt: string;
};
export const emptyProfile: ProfileInput = {
  name: "",
  role: "Founder",
  email: "",
  phone: "",
  linkedin: "",
  status: "Student",
  statusOther: "",
  company: "",
  companyEmail: "",
  companyLinkedin: "",
  website: "",
  sector: "AI & ML",
  sectorOther: "",
  stage: "Idea",
  incorporated: "No",
  funded: "No",
  district: "",
  state: "",
  centre: "Mumbai",
  experience: "Under 6 months",
  description: "",
  socials: [],
  consent: true,
};
export const sectorName = (p: ProfileInput) =>
  p.sector === "Other" ? p.sectorOther : p.sector;
export const statusName = (p: ProfileInput) =>
  p.status === "Other" ? p.statusOther : p.status;
export type Filters = Partial<
  Record<
    | "centre"
    | "sector"
    | "stage"
    | "status"
    | "state"
    | "district"
    | "funded"
    | "incorporated"
    | "role"
    | "experience",
    string
  >
>;
export function filterProfiles(
  profiles: Profile[],
  query: string,
  filters: Filters,
) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return profiles.filter((p) => {
    const haystack = Object.entries(p)
      .filter(([key]) => !["id", "consent", "photo"].includes(key))
      .map(([, v]) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
      .join(" ")
      .toLocaleLowerCase();
    return (
      terms.every((t) => haystack.includes(t)) &&
      Object.entries(filters).every(
        ([k, v]) => !v || filterValue(p, k as keyof Filters) === v,
      )
    );
  });
}
export function filterValue(p: Profile, key: keyof Filters) {
  return key === "sector"
    ? sectorName(p)
    : key === "status"
      ? statusName(p)
      : String(p[key as keyof Profile]);
}
export const CSV_FIELDS = [
  "id",
  "name",
  "role",
  "email",
  "phone",
  "linkedin",
  "status",
  "statusOther",
  "company",
  "companyEmail",
  "companyLinkedin",
  "website",
  "sector",
  "sectorOther",
  "stage",
  "incorporated",
  "funded",
  "district",
  "state",
  "centre",
  "experience",
  "description",
  "socials",
  "createdAt",
  "updatedAt",
  "photoUrl",
  "profileUrl",
] as const;
export function csvCell(value: unknown) {
  let s =
    typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  if (/^[\s]*[=+@\-\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function profilesCsv(profiles: Profile[], origin: string) {
  return (
    "\uFEFF" +
    [
      CSV_FIELDS.join(","),
      ...profiles.map((p) =>
        CSV_FIELDS.map((k) =>
          csvCell(
            k === "profileUrl"
              ? `${origin}/p/${p.id}`
              : k === "photoUrl"
                ? p.photo
                  ? `${origin}/api/profiles/${p.id}/photo`
                  : ""
                : p[k as keyof Profile],
          ),
        ).join(","),
      ),
    ].join("\r\n")
  );
}
const vEscape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
export function vcard(p: ProfileInput) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${vEscape(p.name)}`,
    `N:;${vEscape(p.name)};;;`,
    `ORG:${vEscape(p.company)}`,
    `TITLE:${vEscape(p.role)}`,
    `TEL;TYPE=CELL:${p.phone.replace(/[^+\d]/g, "")}`,
    `EMAIL:${p.email}`,
    `URL:${p.linkedin}`,
    `NOTE:${vEscape(p.description)}`,
    "END:VCARD",
    "",
  ].join("\r\n");
}
