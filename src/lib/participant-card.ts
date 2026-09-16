import QRCode from "qrcode";
import type { Profile } from "./core";
import { cardTextWidth, outlineCardText } from "./card-fonts";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 1500;
const ink = "#171713";
const escapeXml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );

const width = cardTextWidth;
function lines(text: string, size: number, maxWidth: number) {
  const result: string[] = [];
  let current = "";
  for (const word of text.trim().split(/\s+/u)) {
    if (current && width(current + " " + word, size) <= maxWidth) {
      current += " " + word;
      continue;
    }
    if (current) result.push(current);
    current = "";
    for (const char of Array.from(word)) {
      if (current && width(current + char, size) > maxWidth) {
        result.push(current);
        current = "";
      }
      current += char;
    }
  }
  if (current) result.push(current);
  return result;
}
function textBlock(
  text: string,
  y: number,
  maxSize: number,
  maxLines: number,
  weight = 700,
) {
  let size = maxSize;
  let wrapped = lines(text, size, 1016);
  while (wrapped.length > maxLines && size > 12) {
    size -= 2;
    wrapped = lines(text, size, 1016);
  }
  return wrapped
    .map(
      (line, i) =>
        `<text x="92" y="${y + i * (size * 1.18)}" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`,
    )
    .join("");
}

export function participantCardSvg(profile: Profile, origin: string) {
  const url = `${new URL(origin).origin}/p/${profile.id}`;
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const quiet = 4;
  const cell = 520 / (qr.modules.size + quiet * 2);
  const squares: string[] = [];
  for (let row = 0; row < qr.modules.size; row++)
    for (let col = 0; col < qr.modules.size; col++)
      if (qr.modules.get(row, col))
        squares.push(
          `M${(340 + (col + quiet) * cell).toFixed(3)},${(790 + (row + quiet) * cell).toFixed(3)}h${cell.toFixed(3)}v${cell.toFixed(3)}h-${cell.toFixed(3)}z`,
        );
  return outlineCardText(`<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-labelledby="title desc">
    <title id="title">${escapeXml(profile.name)} · Eureka 26 participant card</title>
    <desc id="desc">${escapeXml(profile.company)}. ${escapeXml(profile.role)}. ${escapeXml(profile.centre)} zonals. QR links to ${escapeXml(url)}. Participant-submitted; unofficial.</desc>
    <rect width="1200" height="1500" fill="#faf7e8"/>
    <g fill="${ink}" stroke="${ink}" font-family="DejaVu Sans, Arial, sans-serif" stroke-width="0">
      <rect x="28" y="28" width="1144" height="1444" fill="none" stroke-width="7"/>
      <rect x="80" y="80" width="1052" height="128"/>
      <rect x="68" y="68" width="1052" height="128" fill="#ffea4d" stroke-width="5"/>
      <text x="100" y="153" font-size="66" font-weight="800" letter-spacing="-3">EUREKA</text>
      <text x="385" y="132" font-size="40" font-weight="700">26</text>
      <rect x="756" y="98" width="330" height="66" fill="${ink}"/>
      <text x="921" y="140" fill="#ffea4d" text-anchor="middle" font-family="monospace" font-size="26" font-weight="700">${escapeXml(profile.centre.toUpperCase())} ZONALS</text>
      <text x="92" y="254" font-family="monospace" font-size="22" letter-spacing="3">THE PARTICIPANT NETWORK</text>
      ${textBlock(profile.name, 324, 64, 3)}
      <path d="M92 486H1108" fill="none" stroke-width="3"/>
      ${textBlock(profile.company, 572, 40, 2)}
      ${textBlock(profile.role, 676, 28, 2, 400)}
      <rect x="104" y="778" width="1004" height="578"/>
      <rect x="92" y="766" width="1004" height="578" fill="#c9e5d8" stroke-width="5"/>
      <rect x="338" y="788" width="524" height="524" fill="#ffffff" stroke-width="3"/>
      <path d="${squares.join("")}" fill="${ink}" shape-rendering="crispEdges"/>
      <text x="600" y="1410" text-anchor="middle" font-size="28" font-weight="700" letter-spacing="1">ONE SCAN. A NEW CONNECTION.</text>
      <text x="600" y="1445" text-anchor="middle" font-family="monospace" font-size="17">SIGN IN TO VIEW · UNOFFICIAL PARTICIPANT PROFILE</text>
    </g>
  </svg>`);
}
