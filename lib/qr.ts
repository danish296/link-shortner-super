import QRCode from "qrcode";
import { escapeHtml } from "@/lib/utils";

export interface QrOptions {
  fg: string;
  bg: string;
  margin: number;
  ecc: "L" | "M" | "Q" | "H";
  logo?: string | null;
}

function overlayLogo(svg: string, text: string, fg: string, bg: string): string {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const dim = vb ? Number(vb[1]) : 33;
  const box = dim * 0.2;
  const offset = (dim - box) / 2;
  const radius = box * 0.24;
  const rect = `<rect x="${offset.toFixed(2)}" y="${offset.toFixed(2)}" width="${box.toFixed(2)}" height="${box.toFixed(2)}" rx="${radius.toFixed(2)}" fill="${bg}" stroke="${fg}" stroke-opacity="0.08" stroke-width="${(dim * 0.004).toFixed(3)}"/>`;
  const label = `<text x="${(dim / 2).toFixed(2)}" y="${(dim / 2).toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-family="Inter,Arial,sans-serif" font-size="${(box * 0.4).toFixed(2)}" font-weight="800" fill="${fg}">${escapeHtml(text)}</text>`;
  return svg.replace("</svg>", `${rect}${label}</svg>`);
}

export async function renderQrSvg(target: string, options: QrOptions, width = 512): Promise<string> {
  let svg = await QRCode.toString(target, {
    type: "svg",
    margin: options.margin,
    width,
    errorCorrectionLevel: options.ecc,
    color: { dark: options.fg, light: options.bg },
  });
  if (options.logo) svg = overlayLogo(svg, options.logo, options.fg, options.bg);
  return svg;
}
