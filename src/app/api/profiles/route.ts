import {
  allProfiles,
  checkOrigin,
  db,
  failure,
  ownProfile,
  userId,
} from "@/lib/db";
import { profileSchema } from "@/lib/core";
export async function GET() {
  try {
    await userId();
    return Response.json(
      { profiles: await allProfiles() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const uid = await userId();
    checkOrigin(req);
    if (Number(req.headers.get("content-length")) > 30000)
      return Response.json({ error: "Profile is too large." }, { status: 413 });
    const raw = await req.text();
    if (raw.length > 30000)
      return Response.json({ error: "Profile is too large." }, { status: 413 });
    const parsed = profileSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return Response.json(
        {
          error: "Please check the highlighted fields.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    const existing = await ownProfile(uid);
    const { data, error } = await db()
      .from("profiles")
      .upsert(
        {
          owner_id: uid,
          data: parsed.data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner_id" },
      )
      .select("id")
      .single();
    if (error)
      return Response.json(
        {
          error: "Could not save your profile. Please try again.",
        },
        { status: 409 },
      );
    return Response.json({ id: data.id, updated: Boolean(existing) });
  } catch (e) {
    if (e instanceof SyntaxError)
      return Response.json({ error: "Send a valid profile." }, { status: 400 });
    return failure(e);
  }
}
