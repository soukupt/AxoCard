import { randomUUID, X509Certificate } from "node:crypto";
import { PKPass } from "passkit-generator";

const PASS_TYPE_IDENTIFIER = "pass.cz.sfgtechnologies.axocard";

const ICON_1X = "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAfElEQVR4nO3WsQ2AMAxE0YQtmIP9N4A1YIxQ0SDs2EdkDslXAtLXU1JQy7q3ErwpOphR09oyx0ffDIpeSlT7D+ldh2j5pZLKq+WW9jQeLa/0SVG3w/QdHB29blRTolo+qeUsES2X1HpjpeealkfqUWrvJe0n0pr/vRkdsRPLQS2JqdgN8QAAAABJRU5ErkJggg==";
const ICON_2X = "iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAABAUlEQVR4nO3awQ2CUBCE4cEurMP+O9A2tAw8eSGiyNuZXZf5zyYy7xOJiROu9xkH6JR9Aao8tFse2i0P7VbK0Plylr+nRVm9NNWqFmW0VFSqWjS6NT2VqkUj+6amULVoVFu12KoWjehXJaaqRUfL+IXyqXKirAOiDK2mCRQUBTgHFT60oiZQVBSIP7DQoVU1gSTR6fbY9LrIgwsbuvWito6MLu0eVauGDK2uCSR/6ypVh4f+gyZQ4DmqOoChoUrN0Y9vuiigUd09NOPeHFEtIapo11CGJvtRY9G1mPcmU9Wi71J807JULbpM+dxkqB5GdPL/dZvlod3y0G55aLc8tFtPLXpVseTG9Z4AAAAASUVORK5CYII=";
const ICON_3X = "iVBORw0KGgoAAAANSUhEUgAAAFcAAABXCAYAAABxyNlsAAABz0lEQVR4nO2dwW3DMBAErXSROtx/B04bSRnOix8Dhi3zhrdL7Px1PAyGgn46Lrff+yUgfHUvsDORCxK5IJELErkgkQsSuSCRCxK5IJELErkgkQtiJfd+/e5e4RRWct2wkTuqdarXRq4jFnIfa3Wp10KuK/Jyn1XqUK+8XGek5b6qU71eabnuyMp9t0rlemXl7oCk3LM1qtYrKXcX5OR+WqFivXJyd0JK7mx9avVKyd0NGblV1SnVKyN3RyTkVtemUq+E3F1pl0tVplBvu9ydaZVL19Vdb8oFaZO7qqrOelMuSIvc1TV11ZtyQazkHj9/3SucYrncrivaca5NuaNap3qXyu3+qF99vkW5j7W61LtMbne1g5V7yJf7rFKHepfIVal2sGof6XJf1aleLy5XrdrBir1ky323SuV6Ubmq1Q7o/STLPVujar2YXPVqB+SekuXuAiJ3poZPr/jMq4GqN+WClMvtqLbieaLelAtSKrez2oo51fWmXJAyuQrVVsyrrDflgpTIVaq2Ym5VvSkXZFquYrUV8yvqTbkgU3KVq604Z7belAty5D8RHCkXJHJBIhckckEiFyRyQSIXJHJBIhckckEiFyRyQSIXJHJB/gEl3H3Z3muwTgAAAABJRU5ErkJggg==";

type PassRequest = {
  brand?: string;
  name?: string;
  type?: string;
  code?: string;
  codeFormat?: string;
  passBackgroundColor?: string;
};

function requiredSecret(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server secret: ${name}`);
  return Buffer.from(value, "base64").toString("utf8");
}

function extractTeamIdentifier(signerCert: string): string {
  const subject = new X509Certificate(signerCert).subject;
  const match = subject.match(/(?:^|[\n,])\s*OU\s*=\s*([^,\n]+)/i);
  if (!match?.[1]) throw new Error("Team Identifier not found in signer certificate");
  return match[1].trim();
}

function normalizeHexColor(value?: string): string {
  const fallback = "#111820";
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  return value.toUpperCase();
}

function hexToRgb(value: string): string {
  const hex = value.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function walletBarcodeFormat(format?: string) {
  const normalized = (format || "").toUpperCase();
  if (normalized.includes("QR")) return "PKBarcodeFormatQR" as const;
  if (normalized.includes("PDF")) return "PKBarcodeFormatPDF417" as const;
  if (normalized.includes("AZTEC")) return "PKBarcodeFormatAztec" as const;
  return "PKBarcodeFormatCode128" as const;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body: PassRequest = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const brand = (body.brand || body.name || "AxoCard").trim().slice(0, 60);
    const cardName = (body.name || body.brand || "Věrnostní karta").trim().slice(0, 80);
    const cardType = (body.type || "Věrnostní karta").trim().slice(0, 80);
    const code = (body.code || "").trim().slice(0, 256);
    const backgroundHex = normalizeHexColor(body.passBackgroundColor);

    const signerCert = requiredSecret("APPLE_PASS_CERT_B64");
    const signerKey = requiredSecret("APPLE_PASS_KEY_B64");
    const wwdr = requiredSecret("APPLE_WWDR_CERT_B64");
    const teamIdentifier = extractTeamIdentifier(signerCert);

    const pass = new PKPass(
      {
        "icon.png": Buffer.from(ICON_1X, "base64"),
        "icon@2x.png": Buffer.from(ICON_2X, "base64"),
        "icon@3x.png": Buffer.from(ICON_3X, "base64"),
      },
      {
        wwdr,
        signerCert,
        signerKey,
      },
      {
        formatVersion: 1,
        passTypeIdentifier: PASS_TYPE_IDENTIFIER,
        teamIdentifier,
        organizationName: "AxoCard",
        description: `${cardName} připravená v AxoCard`,
        serialNumber: randomUUID(),
        logoText: brand,
        foregroundColor: "rgb(255, 255, 255)",
        labelColor: "rgb(255, 255, 255)",
        backgroundColor: hexToRgb(backgroundHex),
        generic: {
          primaryFields: [
            { key: "card", label: "KARTA", value: cardName },
          ],
          secondaryFields: [
            { key: "type", label: "TYP", value: cardType },
          ],
        },
      },
    );

    if (code) {
      pass.setBarcodes({
        message: code,
        altText: code,
        format: walletBarcodeFormat(body.codeFormat),
        messageEncoding: "iso-8859-1",
      });
    }

    const buffer = pass.getAsBuffer();
    const safeName = (brand || "axocard").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "axocard";

    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", `attachment; filename=\"${safeName}.pkpass\"`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("AxoCard pass generation failed", error instanceof Error ? error.message : error);
    return res.status(500).json({ error: "Pass se nepodařilo vytvořit." });
  }
}
