import {
  AppError,
  checkOrigin,
  db,
  failure,
  profileRow,
  userId,
} from "@/lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await userId();
    const row = await profileRow((await params).id);
    if (!row.photo_path) throw new AppError("Photo not found.", 404);
    const { data, error } = await db()
      .storage.from("founder-photos")
      .download(row.photo_path);
    if (error) throw new AppError("Could not load photo.", 404);
    return new Response(data, {
      headers: {
        "Content-Type": data.type,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const uid = await userId();
    checkOrigin(req);
    const row = await profileRow((await params).id);
    if (row.owner_id !== uid)
      throw new AppError("You can only edit your own photo.", 403);
    if (Number(req.headers.get("content-length")) > 3 * 1024 * 1024 + 20000)
      throw new AppError("Choose a photo under 3 MB.", 413);
    const file = (await req.formData()).get("photo");
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > 3 * 1024 * 1024
    )
      throw new AppError("Choose a photo under 3 MB.", 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
    const webp =
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!jpg && !png && !webp)
      throw new AppError("Upload a JPG, PNG, or WebP photo.", 400);
    const type = jpg ? "image/jpeg" : png ? "image/png" : "image/webp";
    const path = `${uid}/profile`;
    const client = db();
    const { error } = await client.storage
      .from("founder-photos")
      .upload(path, bytes, { contentType: type, upsert: true });
    if (error)
      throw new AppError(
        "Could not upload photo. Your text profile is saved; retry the photo.",
        503,
      );
    const saved = await client
      .from("profiles")
      .update({ photo_path: path, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("owner_id", uid);
    if (saved.error)
      throw new AppError("Could not attach photo. Please retry.", 503);
    return Response.json({ uploaded: true });
  } catch (e) {
    return failure(e);
  }
}
