import sharp from "sharp";
import { failure, profileRow, toProfile, userId } from "@/lib/db";
import { participantCardSvg } from "@/lib/participant-card";

export const runtime = "nodejs";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await userId();
    const { id } = await params;
    const url = new URL(req.url);
    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      url.host;
    const protocol =
      req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const svg = participantCardSvg(
      toProfile(await profileRow(id)),
      `${protocol}://${host}`,
    );
    const png = await sharp(Buffer.from(svg))
      .png()
      .withMetadata({ density: 300 })
      .toBuffer();
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `${url.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="eureka26-${id}-card.png"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
