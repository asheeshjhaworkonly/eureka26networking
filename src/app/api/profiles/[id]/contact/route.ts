import { failure, profileRow, userId } from "@/lib/db";
import { vcard } from "@/lib/core";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await userId();
    const row = await profileRow((await params).id);
    return new Response(vcard(row.data), {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="eureka26-contact-${row.id}.vcf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
