import { AppError, allProfiles, db, failure, userId } from "@/lib/db";
import { profilesCsv } from "@/lib/core";
export async function GET(req: Request) {
  try {
    const uid = await userId();
    const testMode = process.env.EXPORT_TEST_MODE === "true";
    if (!testMode) {
      const { data, error } = await db()
        .from("purchases")
        .select("user_id")
        .eq("user_id", uid)
        .eq("status", "paid")
        .maybeSingle();
      if (error || !data)
        throw new AppError(
          "Downloads are paused until checkout is enabled.",
          402,
        );
    }
    const now = new Date();
    return new Response(
      profilesCsv(await allProfiles(), new URL(req.url).origin),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="eureka26-directory-${now.toISOString().replace(/[:.]/g, "-")}.csv"`,
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
