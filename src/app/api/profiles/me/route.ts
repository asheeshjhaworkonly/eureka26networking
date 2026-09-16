import {
  checkOrigin,
  db,
  failure,
  ownProfile,
  userId,
  AppError,
} from "@/lib/db";
export async function GET() {
  try {
    return Response.json(
      { profile: await ownProfile(await userId()) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    const uid = await userId();
    checkOrigin(req);
    const client = db();
    const { data, error: lookupError } = await client
      .from("profiles")
      .select("photo_path")
      .eq("owner_id", uid)
      .maybeSingle();
    if (lookupError)
      throw new AppError(
        "Could not load your profile for removal. Please retry.",
        503,
      );
    if (data?.photo_path) {
      const { error: photoError } = await client.storage
        .from("founder-photos")
        .remove([data.photo_path]);
      if (photoError)
        throw new AppError(
          "Could not remove your photo. Please retry profile removal.",
          503,
        );
    }
    const { error } = await client
      .from("profiles")
      .delete()
      .eq("owner_id", uid);
    if (error) throw new Error("Delete failed");
    return Response.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
