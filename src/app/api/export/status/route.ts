import { db, failure, userId } from "@/lib/db";
export async function GET() {
  try {
    const uid = await userId();
    const testMode = process.env.EXPORT_TEST_MODE === "true";
    if (testMode)
      return Response.json(
        { testMode: true, unlocked: true },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const { data, error } = await db()
      .from("purchases")
      .select("status")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) throw new Error("Entitlement lookup failed");
    return Response.json(
      { testMode: false, unlocked: data?.status === "paid" },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
