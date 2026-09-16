import { failure, profileRow, toProfile, userId } from "@/lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await userId();
    return Response.json(
      { profile: toProfile(await profileRow((await params).id)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
