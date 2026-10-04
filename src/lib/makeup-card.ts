import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

const ROYAL = rgb(0x17 / 255, 0x45 / 255, 0x8f / 255);
const GOLD = rgb(0xf7 / 255, 0xa8 / 255, 0x1b / 255);
const INK = rgb(0x10 / 255, 0x26 / 255, 0x4d / 255);
const MUTED = rgb(0x5b / 255, 0x67 / 255, 0x84 / 255);
const MIST = rgb(0xe6 / 255, 0xee / 255, 0xf8 / 255);

export type MakeupCardInput = {
  name: string;
  homeClub: string;
  affiliation: "ROTARIAN" | "ROTARACTOR" | string | null;
  meetingTitle: string;
  meetingDate: string; // already formatted, e.g. "Sunday, 4 October 2026"
  venue: string;
  hostClub: string; // "Rotary Club of Gayaza"
  district: string;
  clubId?: string | null;
  cardNumber: string;
};

/** Keep only characters the built-in PDF fonts can draw (accents are folded, e.g. "é" → "e"). */
function safe(font: PDFFont, s: string) {
  return [...s.normalize("NFKD").replace(/[̀-ͯ]/g, "")].filter((ch) => { try { font.encodeText(ch); return true; } catch { return false; } }).join("");
}

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * A5-landscape make-up card for a visiting Rotarian or Rotaractor, in Rotary colours.
 * Helvetica is used because Arial/Helvetica is one of Rotary's approved free alternatives to Frutiger.
 * The official club logo is embedded unchanged.
 */
export async function makeupCardPdf(c: MakeupCardInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Make-up card: ${c.name}`);
  pdf.setAuthor(c.hostClub);
  pdf.setSubject(`Make-up card, ${c.meetingDate}`);
  const W = 595.28, H = 419.53;
  const page = pdf.addPage([W, H]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const S = (s: string, f: PDFFont = reg) => safe(f, s);

  // frame
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 0, y: H - 10, width: W, height: 10, color: ROYAL });
  page.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: GOLD });
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 46, borderColor: MIST, borderWidth: 1.2 });

  // logo (top-left) — official mark, unchanged
  try {
    const png = await pdf.embedPng(await readFile(path.join(process.cwd(), "public/brand/rc-gayaza-logo.png")));
    const h = 46, w = (png.width / png.height) * h;
    page.drawImage(png, { x: 40, y: H - 40 - h, width: w, height: h });
  } catch { /* logo missing: card still valid */ }

  // label (top-right)
  const label = "MAKE-UP CARD";
  const lw = bold.widthOfTextAtSize(label, 10) + 24;
  page.drawRectangle({ x: W - 40 - lw, y: H - 70, width: lw, height: 22, color: GOLD });
  page.drawText(label, { x: W - 40 - lw + 12, y: H - 63, size: 10, font: bold, color: INK });
  page.drawText(S(`No. ${c.cardNumber}`), { x: W - 40 - lw, y: H - 84, size: 8, font: reg, color: MUTED });

  let y = H - 128;
  const x = 40, maxW = W - 80;
  page.drawText("This is to certify that", { x, y, size: 11, font: ital, color: MUTED });
  y -= 34;
  // name, shrink to fit
  let size = 28;
  const name = S(c.name, bold);
  while (bold.widthOfTextAtSize(name, size) > maxW && size > 14) size -= 1;
  page.drawText(name, { x, y, size, font: bold, color: ROYAL });
  y -= 22;
  const who = c.affiliation === "ROTARACTOR" ? "Rotaractor" : c.affiliation === "ROTARIAN" ? "Rotarian" : "Member";
  for (const l of wrap(reg, S(`${who}, ${c.homeClub}`), 12, maxW)) { page.drawText(l, { x, y, size: 12, font: reg, color: INK }); y -= 16; }
  y -= 10;
  const body = `attended the meeting of the ${c.hostClub}, Rotary District ${c.district}${c.clubId ? ` (Club ID ${c.clubId})` : ""}:`;
  for (const l of wrap(reg, S(body), 11, maxW)) { page.drawText(l, { x, y, size: 11, font: reg, color: INK }); y -= 15; }
  y -= 6;
  page.drawRectangle({ x, y: y - 40, width: maxW, height: 50, color: MIST });
  page.drawRectangle({ x, y: y - 40, width: 4, height: 50, color: GOLD });
  page.drawText(S(c.meetingTitle, bold).slice(0, 90), { x: x + 16, y: y - 8, size: 12, font: bold, color: ROYAL });
  page.drawText(S(`${c.meetingDate}  ·  ${c.venue}`).slice(0, 110), { x: x + 16, y: y - 26, size: 10, font: reg, color: INK });

  // footer: no signature; the card is issued from the attendance register
  const fy = 54;
  page.drawText(S(c.hostClub, bold), { x, y: fy + 4, size: 10, font: bold, color: INK });
  page.drawText(S(`Rotary District ${c.district}`), { x, y: fy - 9, size: 8.5, font: reg, color: MUTED });
  page.drawText("Issued electronically from the club's attendance register.", { x, y: fy - 21, size: 7.5, font: ital, color: MUTED });
  const motto = "Service Above Self";
  page.drawText(motto, { x: W - 40 - ital.widthOfTextAtSize(motto, 12), y: fy, size: 12, font: ital, color: ROYAL });

  return pdf.save();
}
