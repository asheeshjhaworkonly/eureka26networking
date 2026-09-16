import { failure, userId } from "@/lib/db";
import { exportAccess } from "@/lib/export-access";
export async function GET() {
  try {
    const uid = await userId();
    return Response.json(await exportAccess(uid), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
