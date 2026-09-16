import { openSync, type Font } from "fontkit";
import { join } from "node:path";

const cache = new Map<string, Font>();
function font(file: string) {
  if (!cache.has(file))
    cache.set(
      file,
      openSync(join(process.cwd(), "assets", "fonts", file)) as Font,
    );
  return cache.get(file)!;
}
function segments(text: string, bold: boolean) {
  const weight = bold ? 700 : 400;
  const fonts = [
    font(`space-grotesk-latin-${weight}-normal.woff`),
    font(`space-grotesk-latin-ext-${weight}-normal.woff`),
    font(`noto-sans-devanagari-devanagari-${weight}-normal.woff`),
  ];
  const result: { font: Font; text: string }[] = [];
  for (const char of Array.from(text)) {
    const selected =
      fonts.find((f) => f.hasGlyphForCodePoint(char.codePointAt(0)!)) ||
      fonts[0];
    const previous = result.at(-1);
    if (previous?.font === selected) previous.text += char;
    else result.push({ font: selected, text: char });
  }
  return result;
}
export function cardTextWidth(text: string, size: number, bold = true) {
  return segments(text, bold).reduce(
    (sum, item) =>
      sum +
      (item.font.layout(item.text).advanceWidth * size) / item.font.unitsPerEm,
    0,
  );
}
const xml = (text: string) =>
  text.replace(
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

// SVG glyph outlines do not depend on system fonts in the hosting environment.
export function outlineCardText(svg: string) {
  return svg.replace(
    /<text\b([^>]*)>([\s\S]*?)<\/text>/g,
    (_, attrs: string, encoded: string) => {
      const attr = (name: string) =>
        attrs.match(new RegExp("(?:^|\\s)" + name + '="([^"]*)"'))?.[1];
      const text = encoded.replace(
        /&(amp|lt|gt|quot|apos);/g,
        (_, c: string) =>
          ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[c]!,
      );
      const size = Number(attr("font-size"));
      const bold = Number(attr("font-weight") || 400) >= 600;
      const spacing = Number(attr("letter-spacing") || 0);
      const items = segments(text, bold);
      const textWidth =
        cardTextWidth(text, size, bold) +
        Math.max(0, Array.from(text).length - 1) * spacing;
      let x =
        Number(attr("x")) -
        (attr("text-anchor") === "middle" ? textWidth / 2 : 0);
      const y = Number(attr("y"));
      const paths: string[] = [];
      for (const item of items) {
        const scale = size / item.font.unitsPerEm;
        const run = item.font.layout(item.text);
        for (let i = 0; i < run.glyphs.length; i++) {
          const position = run.positions[i];
          paths.push(
            `<path d="${run.glyphs[i].path.toSVG()}" transform="translate(${x + position.xOffset * scale},${y - position.yOffset * scale}) scale(${scale},${-scale})"/>`,
          );
          x += position.xAdvance * scale + spacing;
        }
      }
      return `<g aria-label="${xml(text)}"${attr("fill") ? ` fill="${attr("fill")}"` : ""}>${paths.join("")}</g>`;
    },
  );
}
