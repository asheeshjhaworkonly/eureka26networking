import { AppError, allProfiles, failure, userId } from "@/lib/db";
import { profilesCsv } from "@/lib/core";
import { exportAccess } from "@/lib/export-access";
export async function GET(req: Request) {
  try {
    const uid = await userId();
    if (!(await exportAccess(uid)).unlocked)
      throw new AppError(
        "This download requires one-time access. Checkout is not available yet.",
        402,
      );
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
