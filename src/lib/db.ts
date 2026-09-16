import "server-only";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Profile, ProfileInput } from "./core";
import { sameOrigin } from "./core";

export class AppError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}
export async function userId() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId)
    throw new AppError("Sign in to continue.", 401);
  return userId;
}
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new AppError(
      "The directory database is not configured yet. Please try again after setup.",
      503,
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
type Row = {
  id: string;
  owner_id: string;
  data: ProfileInput;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
};
export function toProfile(r: Row): Profile {
  return {
    ...r.data,
    id: r.id,
    photo: Boolean(r.photo_path),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
export async function allProfiles() {
  const client = db();
  const rows: Profile[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499);
    if (error)
      throw new AppError(
        "Could not load the directory. Please try again.",
        503,
      );
    rows.push(...(data as Row[]).map(toProfile));
    if (data.length < 500) break;
  }
  return rows;
}
export async function ownProfile(uid: string) {
  const { data, error } = await db()
    .from("profiles")
    .select("*")
    .eq("owner_id", uid)
    .maybeSingle();
  if (error) throw new AppError("Could not load your profile.", 503);
  return data ? toProfile(data as Row) : null;
}
export async function profileRow(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new AppError("Profile not found.", 404);
  const { data, error } = await db()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError("Could not load this profile.", 503);
  if (!data) throw new AppError("Profile not found.", 404);
  return data as Row;
}
export function failure(error: unknown) {
  if (error instanceof AppError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(
    "Request failed:",
    error instanceof Error ? error.name : "Unknown error",
  );
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).host;
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    new URL(request.url).protocol.replace(":", "");
  if (!sameOrigin(origin, host, protocol))
    throw new AppError("This request is not allowed.", 403);
}
