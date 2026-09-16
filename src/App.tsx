import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat } from "@zxing/library";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { createWorker } from "tesseract.js";
import "./styles.css";

type Screen = "home" | "first" | "second" | "review" | "done";
type CardStatus = "wallet" | "ready" | "none";

type SavedCard = {
  id: string;
  brand: string;
  name: string;
  type: string;
  code: string;
  codeFormat: string;
  passBackgroundColor: string;
  passColorMode: "auto" | "manual";
  status: CardStatus;
};

type Draft = {
  firstImage: string;
  secondImage: string;
  brand: string;
  type: string;
  code: string;
  codeFormat: string;
  codeSource: "barcode" | "text" | "";
  passBackgroundColor: string;
  passColorMode: "auto" | "manual";
};

const DEMO_CARDS: SavedCard[] = [
  { id: "tesco", brand: "TESCO", name: "Tesco Clubcard", type: "Věrnostní karta", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "wallet" },
  { id: "kaufland", brand: "K", name: "Kaufland Card", type: "Věrnostní karta", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "wallet" },
  { id: "benu", brand: "BENU", name: "BENU", type: "Lékárna", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "wallet" },
  { id: "albert", brand: "albert", name: "Albert", type: "Věrnostní karta", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "ready" },
  { id: "teta", brand: "teta", name: "Teta", type: "Drogerie", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "ready" },
  { id: "mobelix", brand: "MÖBELIX", name: "Möbelix", type: "Věrnostní karta", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "none" },
  { id: "billa", brand: "BILLA", name: "BILLA Bonus Club", type: "Věrnostní karta", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "wallet" },
  { id: "ikea", brand: "IKEA", name: "IKEA Family", type: "Věrnostní karta", code: "", codeFormat: "", passBackgroundColor: "#111820", passColorMode: "auto", status: "ready" },
];

const FIGMA = {
  hero: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/4162d.png",
  logoMark: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/36096.png",
  settings: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/8c9f1.png",
  statusSignal: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/227b2.png",
  statusWifi: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/0bf45.png",
  statusBattery: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/84c79.png",
  ctaBg: "https://www.figma.com/api/mcp/asset/4235d32c-4e6e-447e-bfc8-f12398916349/0bb77.png",
  ctaArrow: "https://www.figma.com/api/mcp/asset/4235d32c-4e6e-447e-bfc8-f12398916349/d380e.png",
  ctaCamera: "https://www.figma.com/api/mcp/asset/4235d32c-4e6e-447e-bfc8-f12398916349/43a6c.png",
};

const STORAGE_KEY = "axocard_saved_cards_v2";

function readSavedCards(): SavedCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function Status({ status }: { status: CardStatus }) {
  if (status === "wallet") return <span className="status wallet">● <span>V Apple Wallet</span></span>;
  if (status === "ready") return <span className="status ready">◷ <span>Připraveno přidat</span></span>;
  return <span className="status none">⊖ <span>Nevytvořeno</span></span>;
}

function CardLogo({ brand }: { brand: string }) {
  const cls = brand.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return <div className={"card-logo " + cls}>{brand}</div>;
}

function Home({ onAdd, savedCards }: { onAdd: () => void; savedCards: SavedCard[] }) {
  const [sortAsc, setSortAsc] = useState(true);
  const allCards = useMemo(() => [...savedCards, ...DEMO_CARDS], [savedCards]);
  const sorted = useMemo(
    () => [...allCards].sort((a,b) => sortAsc ? a.name.localeCompare(b.name, "cs") : b.name.localeCompare(a.name, "cs")),
    [allCards, sortAsc],
  );

  return (
    <main className="screen">
      <section className="hero" aria-label="AxoCard">
        <img className="hero-art" src={FIGMA.hero} alt="" aria-hidden="true" />
        <div className="ios-time">9:41</div>
        <div className="ios-status" aria-hidden="true">
          <img src={FIGMA.statusSignal} alt="" />
          <img src={FIGMA.statusWifi} alt="" />
          <img src={FIGMA.statusBattery} alt="" />
        </div>
        <div className="brand">
          <img src={FIGMA.logoMark} alt="" />
          <div className="brand-copy">
            <div><span>Axo</span><strong>Card</strong></div>
            <small>KARTY DO APPLE WALLET · JEDNODUŠE A RYCHLE</small>
          </div>
        </div>
        <button className="settings" type="button" aria-label="Nastavení">
          <img src={FIGMA.settings} alt="" />
        </button>
        <div className="hero-copy">
          <h1>Skutečný<br /><span>svět blíž.</span></h1>
          <p>Věrnostní karty,<br />digitálně a bez starostí.</p>
        </div>
        <div className="benefits" aria-label="Výhody">
          <span>⚡ Rychle</span>
          <span>♙ Bez účtu</span>
          <span>⬟ Bezpečně</span>
        </div>
        <div className="hand-note">Malé karty.<br />Velké možnosti.</div>
      </section>

      <section className="cta-wrap">
        <button className="add-card" type="button" onClick={onAdd}>
          <img className="cta-bg" src={FIGMA.ctaBg} alt="" aria-hidden="true" />
          <img className="cta-camera" src={FIGMA.ctaCamera} alt="" aria-hidden="true" />
          <div className="cta-copy">
            <strong>Přidat novou kartu</strong>
            <span>Vyfotit, naskenovat nebo vybrat z galerie</span>
          </div>
          <img className="cta-arrow" src={FIGMA.ctaArrow} alt="" aria-hidden="true" />
        </button>
      </section>

      <section className="wallet-list">
        <div className="list-head">
          <div className="list-title">Připravené pro Apple Wallet <span className="count">{allCards.length}</span></div>
          <button type="button" className="sort" onClick={() => setSortAsc(v => !v)}>Seřadit ⇅</button>
        </div>
        <div className="rows">
          {sorted.map((card) => (
            <button className="card-row" type="button" key={card.id}>
              <CardLogo brand={card.brand} />
              <div className="card-copy">
                <strong>{card.name}</strong>
                <span>{card.type}</span>
              </div>
              <Status status={card.status} />
              <span className="chev">›</span>
              <span className="more">•••</span>
            </button>
          ))}
        </div>
      </section>

      <section className="water">
        <div className="wave wave-a" />
        <div className="wave wave-b" />
        <div className="wave wave-c" />
        <p>Z obyčejných karet více svobody.</p>
        <div className="home-indicator" />
      </section>
    </main>
  );
}



const PASS_COLOR_PRESETS = [
  { name: "Modrá", value: "#176BFF" },
  { name: "Tyrkysová", value: "#0AAFC9" },
  { name: "Zelená", value: "#0E8F66" },
  { name: "Červená", value: "#C9283E" },
  { name: "Oranžová", value: "#E85D16" },
  { name: "Fialová", value: "#6C4AD5" },
  { name: "Černá", value: "#111111" },
];

const BRAND_COLORS: Record<string, string> = {
  benu: "#009640",
  tesco: "#00539F",
  kaufland: "#E30613",
  albert: "#009FE3",
  teta: "#E83E8C",
  mobelix: "#18B9C8",
  möbelix: "#18B9C8",
  billa: "#F2C400",
  ikea: "#0058A3",
  lidl: "#0050AA",
  dm: "#003B7A",
  rossmann: "#D81E05",
  globus: "#E30613",
  "dr.max": "#00A651",
  uncs: "#F15A24",
};

function brandColor(provider: string): string {
  return BRAND_COLORS[provider.trim().toLowerCase()] ?? "";
}

async function extractImagePassColor(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#111820";
    ctx.drawImage(bitmap, 0, 0, 48, 48);
    bitmap.close();
    const data = ctx.getImageData(0, 0, 48, 48).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 32) {
      const rr = data[i], gg = data[i + 1], bb = data[i + 2];
      const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
      const brightness = (rr + gg + bb) / 3;
      if (brightness < 35 || brightness > 230 || max - min < 25) continue;
      r += rr; g += gg; b += bb; n++;
    }
    if (!n) return "#111820";
    const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
    return ("#" + hex(r) + hex(g) + hex(b)).toUpperCase();
  } catch {
    return "#111820";
  }
}


const KNOWN_PROVIDERS = [
  "BENU", "Tesco", "Kaufland", "Albert", "Teta", "Möbelix", "BILLA", "IKEA",
  "Lidl", "dm", "Rossmann", "Globus", "Dr.Max"
];

function inferProviderFromFilename(file: File): string {
  const normalized = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hit = KNOWN_PROVIDERS.find((provider) =>
    normalized.includes(provider.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())
  );
  return hit ?? "";
}

async function tryReadCardText(file: File): Promise<{ provider: string; cardNumber: string }> {
  const filenameHit = inferProviderFromFilename(file);

  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(file);
    await worker.terminate();

    const rawText = data.text || "";
    const normalized = rawText
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    let provider = filenameHit;

    if (!provider) {
      const knownHit = KNOWN_PROVIDERS.find((candidate) => {
        const key = candidate
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        return normalized.includes(key);
      });
      provider = knownHit ?? "";
    }

    if (!provider) {
      const stopWords = new Set([
        "CLENSKY", "CLENSKY PRUKAZ", "PRUKAZ", "CISLO", "CISLO KARTY", "KARTY",
        "KARTA", "KLUB", "CLUB", "CARD", "MEMBER", "MEMBERSHIP", "LOYALTY",
        "VERNOSTNI", "ZAKAZNICKA", "ZAKAZNICKY", "CUSTOMER", "ID"
      ]);

      const candidates = rawText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => [line, ...line.split(/\s+/)])
        .map((value) => value.replace(/[^A-Za-z0-9.&-]/g, "").trim())
        .filter((value) => value.length >= 2 && value.length <= 24)
        .filter((value) => !/^\d+$/.test(value))
        .filter((value) => !stopWords.has(value.toUpperCase()))
        .map((value) => {
          const letters = value.replace(/[^A-Za-z]/g, "");
          const upper = letters.replace(/[^A-Z]/g, "").length;
          const upperRatio = letters.length ? upper / letters.length : 0;
          const score =
            (upperRatio > 0.85 ? 5 : 0) +
            (value.length >= 3 && value.length <= 10 ? 3 : 0) +
            (/^[A-Z0-9.&-]+$/.test(value) ? 2 : 0);
          return { value, score };
        })
        .sort((a, b) => b.score - a.score);

      provider = candidates[0]?.score >= 5 ? candidates[0].value : "";
    }

    // Fallback for screenshots where the barcode graphic itself is not decodable
    // but the human-readable membership/card number is printed next to it.
    // Prefer a number near "card number" labels; otherwise use the longest plausible digit run.
    const normalizedLines = rawText
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    let cardNumber = "";
    for (let i = 0; i < normalizedLines.length; i++) {
      const line = normalizedLines[i].toLowerCase();
      if (/cislo\s*karty|card\s*(number|no)|member\s*(number|no)|membership\s*(number|no)/i.test(line)) {
        const nearby = [normalizedLines[i], normalizedLines[i + 1] ?? ""].join(" ");
        const match = nearby.match(/\b\d{6,20}\b/);
        if (match) {
          cardNumber = match[0];
          break;
        }
      }
    }

    if (!cardNumber) {
      const numbers = rawText.match(/\b\d{6,20}\b/g) ?? [];
      cardNumber = numbers
        .filter((value) => !/^20\d{6,12}$/.test(value))
        .sort((a, b) => b.length - a.length)[0] ?? "";
    }

    return { provider, cardNumber };
  } catch {
    return { provider: filenameHit, cardNumber: "" };
  }
}

function findBrightBarcodeRegion(bitmap: ImageBitmap): { x: number; y: number; w: number; h: number } | null {
  const maxSide = 300;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, w, h);

  const pixels = ctx.getImageData(0, 0, w, h).data;
  const bright = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      bright[y * w + x] = lum > 215 ? 1 : 0;
    }
  }

  const seen = new Uint8Array(w * h);
  let best: { x0: number; y0: number; x1: number; y1: number; area: number; score: number } | null = null;

  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++) {
      const seed = sy * w + sx;
      if (!bright[seed] || seen[seed]) continue;

      const qx: number[] = [sx];
      const qy: number[] = [sy];
      seen[seed] = 1;
      let head = 0;
      let x0 = sx, x1 = sx, y0 = sy, y1 = sy, area = 0;

      while (head < qx.length) {
        const x = qx[head];
        const y = qy[head];
        head++;
        area++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;

        const neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const idx = ny * w + nx;
          if (bright[idx] && !seen[idx]) {
            seen[idx] = 1;
            qx.push(nx);
            qy.push(ny);
          }
        }
      }

      const bw = x1 - x0 + 1;
      const bh = y1 - y0 + 1;
      const boxArea = bw * bh;
      const ratio = bw / bh;
      const fill = area / boxArea;
      const cy = ((y0 + y1) / 2) / h;

      // Typical Wallet/card barcode panel: wide, bright, fairly solid, not at the very bottom UI stack.
      if (area < 120 || ratio < 1.8 || ratio > 6.5 || fill < 0.55 || cy < 0.25 || cy > 0.86) continue;

      const centered = 1 - Math.min(1, Math.abs(((x0 + x1) / 2) / w - 0.5) * 1.5);
      const verticalPreference = 1 - Math.min(1, Math.abs(cy - 0.62));
      const score = boxArea * fill * (0.6 + 0.25 * centered + 0.15 * verticalPreference);

      if (!best || score > best.score) best = { x0, y0, x1, y1, area, score };
    }
  }

  if (!best) return null;

  const inv = 1 / scale;
  const padX = (best.x1 - best.x0 + 1) * inv * 0.08;
  const padY = (best.y1 - best.y0 + 1) * inv * 0.15;
  const x = Math.max(0, best.x0 * inv - padX);
  const y = Math.max(0, best.y0 * inv - padY);
  const rw = Math.min(bitmap.width - x, (best.x1 - best.x0 + 1) * inv + padX * 2);
  const rh = Math.min(bitmap.height - y, (best.y1 - best.y0 + 1) * inv + padY * 2);
  return { x, y, w: rw, h: rh };
}

async function tryDetectBarcode(file: File): Promise<{ code: string; format: string }> {
  const BarcodeDetectorCtor = (window as unknown as {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => {
      detect: (source: ImageBitmap | HTMLCanvasElement) => Promise<Array<{ rawValue?: string; format?: string }>>;
    };
  }).BarcodeDetector;

  const tryNative = async (source: ImageBitmap | HTMLCanvasElement) => {
    if (!BarcodeDetectorCtor) return { code: "", format: "" };
    try {
      const detector = new BarcodeDetectorCtor({
        formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
      });
      const result = await detector.detect(source);
      const code = result[0]?.rawValue?.trim() ?? "";
      return code ? { code, format: (result[0]?.format ?? "").toUpperCase() } : { code: "", format: "" };
    } catch {
      return { code: "", format: "" };
    }
  };

  const reader = new BrowserMultiFormatReader();
  const tryZXing = async (canvas: HTMLCanvasElement) => {
    try {
      const result = await reader.decodeFromCanvas(canvas);
      return {
        code: result.getText().trim(),
        format: String(BarcodeFormat[result.getBarcodeFormat()] ?? ""),
      };
    } catch {
      return { code: "", format: "" };
    }
  };

  const bitmap = await createImageBitmap(file);
  try {
    const nativeFull = await tryNative(bitmap);
    if (nativeFull.code) return nativeFull;

    const detectedBright = findBrightBarcodeRegion(bitmap);

    const regions = [
      ...(detectedBright ? [detectedBright] : []),
      { x: 0, y: bitmap.height * 0.35, w: bitmap.width, h: bitmap.height * 0.55 },
      { x: bitmap.width * 0.05, y: bitmap.height * 0.45, w: bitmap.width * 0.90, h: bitmap.height * 0.38 },
      { x: bitmap.width * 0.10, y: bitmap.height * 0.50, w: bitmap.width * 0.80, h: bitmap.height * 0.30 },
      { x: 0, y: 0, w: bitmap.width, h: bitmap.height },
    ];

    for (const region of regions) {
      const sx = Math.max(0, Math.floor(region.x));
      const sy = Math.max(0, Math.floor(region.y));
      const sw = Math.max(1, Math.min(bitmap.width - sx, Math.floor(region.w)));
      const sh = Math.max(1, Math.min(bitmap.height - sy, Math.floor(region.h)));

      for (const scale of [1.25, 1.75, 2.25]) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(2200, Math.max(420, Math.round(sw * scale)));
        canvas.height = Math.min(1600, Math.max(220, Math.round(sh * scale)));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        const native = await tryNative(canvas);
        if (native.code) return native;

        const direct = await tryZXing(canvas);
        if (direct.code) return direct;

        const original = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // grayscale + contrast
        const contrasted = new ImageData(new Uint8ClampedArray(original.data), original.width, original.height);
        for (let i = 0; i < contrasted.data.length; i += 4) {
          const gray = Math.round(0.299 * contrasted.data[i] + 0.587 * contrasted.data[i + 1] + 0.114 * contrasted.data[i + 2]);
          const v = gray < 155 ? Math.max(0, gray - 45) : Math.min(255, gray + 45);
          contrasted.data[i] = contrasted.data[i + 1] = contrasted.data[i + 2] = v;
        }
        ctx.putImageData(contrasted, 0, 0);
        const contrastResult = await tryZXing(canvas);
        if (contrastResult.code) return contrastResult;

        // hard threshold - often best for black bars on a white Wallet panel
        const thresholded = new ImageData(new Uint8ClampedArray(original.data), original.width, original.height);
        for (let i = 0; i < thresholded.data.length; i += 4) {
          const gray = Math.round(0.299 * thresholded.data[i] + 0.587 * thresholded.data[i + 1] + 0.114 * thresholded.data[i + 2]);
          const v = gray < 165 ? 0 : 255;
          thresholded.data[i] = thresholded.data[i + 1] = thresholded.data[i + 2] = v;
        }
        ctx.putImageData(thresholded, 0, 0);
        const thresholdResult = await tryZXing(canvas);
        if (thresholdResult.code) return thresholdResult;

        // inverted threshold fallback
        for (let i = 0; i < thresholded.data.length; i += 4) {
          const v = 255 - thresholded.data[i];
          thresholded.data[i] = thresholded.data[i + 1] = thresholded.data[i + 2] = v;
        }
        ctx.putImageData(thresholded, 0, 0);
        const inverted = await tryZXing(canvas);
        if (inverted.code) return inverted;
      }
    }

    return { code: "", format: "" };
  } finally {
    bitmap.close();
  }
}

async function recognizeCardSide(file: File): Promise<{ code: string; codeFormat: string; provider: string; codeSource: "barcode" | "text" | "" }> {
  const [barcode, text] = await Promise.all([
    tryDetectBarcode(file),
    tryReadCardText(file),
  ]);

  if (barcode.code) {
    return {
      code: barcode.code,
      codeFormat: barcode.format,
      provider: text.provider,
      codeSource: "barcode",
    };
  }

  if (text.cardNumber) {
    return {
      code: text.cardNumber,
      codeFormat: "CODE128",
      provider: text.provider,
      codeSource: "text",
    };
  }

  return {
    code: "",
    codeFormat: "",
    provider: text.provider,
    codeSource: "",
  };
}

function FlowHeader({ step, title, onBack }: { step: string; title: string; onBack: () => void }) {
  return (
    <header className="flow-header">
      <button className="back" type="button" onClick={onBack} aria-label="Zpět">‹</button>
      <div>
        <div className="flow-kicker">Přidat kartu · {step}</div>
        <div className="flow-title-small">{title}</div>
      </div>
    </header>
  );
}

function ImagePicker({
  title,
  required,
  preview,
  onChoose,
}: {
  title: string;
  required?: boolean;
  preview: string;
  onChoose: (file: File) => void;
}) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChoose(file);
    e.target.value = "";
  };

  return (
    <div className={"image-picker " + (preview ? "has-preview" : "")}>
      <div className="dropzone">
        {preview ? (
          <img className="card-preview" src={preview} alt={title} />
        ) : (
          <>
            <div className="capture-icon">▣</div>
            <strong>{title}</strong>
            <span>{required ? "Povinné" : "Volitelné"}</span>
          </>
        )}
      </div>

      <label className="picker-button unified-picker">
        <input type="file" accept="image/*" onChange={handle} />
        <span>📷 Vyfotit / nahrát</span>
      </label>

      {preview && <div className="replace-copy">Klepnutím můžeš fotografii znovu vyfotit nebo vybrat jinou z Fotek.</div>}
    </div>
  );
}

function FirstSide({
  draft,
  onDraft,
  onBack,
  onNext,
}: {
  draft: Draft;
  onDraft: (next: Partial<Draft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [scanning, setScanning] = useState(false);

  const choose = async (file: File) => {
    const url = URL.createObjectURL(file);
    onDraft({ firstImage: url });
    setScanning(true);
    const { code, codeFormat, provider, codeSource } = await recognizeCardSide(file);
    onDraft({
      firstImage: url,
      ...(code ? { code, codeFormat, codeSource } : {}),
      ...(provider ? { brand: provider } : {}),
    });
    setScanning(false);
  };

  return (
    <main className="flow-screen">
      <FlowHeader step="1 z 3" title="První strana" onBack={onBack} />
      <section className="flow-card">
        <div className="step-pill">1</div>
        <h2>První strana karty</h2>
        <p>Vyfoť nebo vyber první stranu karty. Tato strana je povinná.</p>
        <ImagePicker title="První strana" required preview={draft.firstImage} onChoose={choose} />
        <div className="truth-note">
          {scanning
            ? "AxoCard čte kód a hledá název poskytovatele…"
            : draft.code || draft.brand
              ? [
                  draft.code ? (draft.codeSource === "text" ? "Číslo karty načteno z textu; vytvoří se z něj skenovatelný Code 128." : "Čárový/QR kód rozpoznán.") : "",
                  draft.brand ? `Poskytovatel: ${draft.brand}.` : ""
                ].filter(Boolean).join(" ")
              : "AxoCard se pokusí přečíst kód i název poskytovatele přímo z fotografie. U screenshotů z Walletu zkouší i ořez a zvýšení kontrastu."}
        </div>
        <button className="primary" type="button" disabled={!draft.firstImage || scanning} onClick={onNext}>
          Pokračovat
        </button>
      </section>
    </main>
  );
}

function SecondSide({
  draft,
  onDraft,
  onBack,
  onNext,
}: {
  draft: Draft;
  onDraft: (next: Partial<Draft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [scanning, setScanning] = useState(false);

  const choose = async (file: File) => {
    const url = URL.createObjectURL(file);
    onDraft({ secondImage: url });
    setScanning(true);
    const { code, codeFormat, provider, codeSource } = await recognizeCardSide(file);

    onDraft({
      secondImage: url,
      ...(!draft.code && code ? { code, codeFormat, codeSource } : {}),
      ...(!draft.brand && provider ? { brand: provider } : {}),
    });
    setScanning(false);
  };

  return (
    <main className="flow-screen">
      <FlowHeader step="2 z 3" title="Druhá strana" onBack={onBack} />
      <section className="flow-card">
        <div className="step-pill">2</div>
        <h2>Druhá strana karty</h2>
        <p className="optional">Volitelné</p>
        <p>Vyfoť nebo vyber druhou stranu karty. Tady často bývá čárový kód nebo QR.</p>
        <ImagePicker title="Druhá strana" preview={draft.secondImage} onChoose={choose} />
        <div className="truth-note">
          {scanning
            ? "AxoCard čte druhou stranu: hledá kód i poskytovatele…"
            : draft.code || draft.brand
              ? [
                  draft.code ? (draft.codeSource === "text" ? "Číslo karty načteno z textu; vytvoří se z něj skenovatelný Code 128." : "Čárový/QR kód rozpoznán.") : "",
                  draft.brand ? `Poskytovatel: ${draft.brand}.` : ""
                ].filter(Boolean).join(" ")
              : "AxoCard zkusí z druhé strany doplnit to, co na první nenašel — kód i poskytovatele."}
        </div>
        <button className="primary" type="button" disabled={scanning} onClick={onNext}>
          Pokračovat
        </button>
      </section>
    </main>
  );
}

function Review({
  draft,
  onDraft,
  onBack,
  onSave,
}: {
  draft: Draft;
  onDraft: (next: Partial<Draft>) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const canSave = draft.brand.trim().length > 0;

  return (
    <main className="flow-screen">
      <FlowHeader step="3 z 3" title="Kontrola karty" onBack={onBack} />
      <section className="flow-card">
        <div className="step-pill">3</div>
        <h2>Je vše v pořádku?</h2>
        <p>Zkontroluj údaje a v případě potřeby je uprav.</p>

        <div className="thumbs">
          {draft.firstImage && <img src={draft.firstImage} alt="První strana" />}
          {draft.secondImage && <img src={draft.secondImage} alt="Druhá strana" />}
        </div>

        <div className="field">
          <label htmlFor="brand">Značka / název</label>
          <input id="brand" value={draft.brand} onChange={(e) => onDraft({ brand: e.target.value })} placeholder="Např. BENU" />
        </div>
        <div className="field">
          <label htmlFor="type">Typ</label>
          <input id="type" value={draft.type} onChange={(e) => onDraft({ type: e.target.value })} placeholder="Věrnostní karta" />
        </div>
        <div className="field">
          <label htmlFor="code">Čárový kód / QR</label>
          <input id="code" value={draft.code} onChange={(e) => onDraft({ code: e.target.value, codeFormat: "", codeSource: "" })} placeholder="Doplňte ručně, pokud nebyl rozpoznán" />
        </div>

        <div className="truth-note">
          {draft.codeSource === "text"
            ? "Grafický čárový kód se nepodařilo dekódovat, ale číslo karty bylo přečteno z textu na kartě. AxoCard z něj vytvoří Code 128 pro skenování."
            : "AxoCard nevyplňuje falešný kód. Pokud se kód ani číslo karty nepodaří skutečně přečíst, pole zůstane prázdné."}
        </div>

        <button className="primary" type="button" disabled={!canSave} onClick={onSave}>
          Vytvořit kartu
        </button>
      </section>
    </main>
  );
}

function BarcodeVisual({ code, format }: { code: string; format: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    setQrUrl("");
    if (!code) return;

    const normalized = format.toUpperCase();
    if (normalized.includes("QR")) {
      QRCode.toDataURL(code, { margin: 1, width: 300, errorCorrectionLevel: "M" })
        .then(setQrUrl)
        .catch(() => setQrUrl(""));
      return;
    }

    if (!svgRef.current) return;
    const formats: Record<string, string> = {
      EAN_13: "EAN13", EAN13: "EAN13",
      EAN_8: "EAN8", EAN8: "EAN8",
      CODE_128: "CODE128", CODE128: "CODE128",
      CODE_39: "CODE39", CODE39: "CODE39",
      UPC_A: "UPC", UPCA: "UPC",
      UPC_E: "UPC", UPCE: "UPC",
    };

    try {
      JsBarcode(svgRef.current, code, {
        format: formats[normalized] ?? "CODE128",
        lineColor: "#111111",
        background: "#ffffff",
        width: 2,
        height: 96,
        margin: 12,
        displayValue: true,
        fontSize: 18,
      });
    } catch {
      try {
        JsBarcode(svgRef.current, code, {
          format: "CODE128",
          lineColor: "#111111",
          background: "#ffffff",
          width: 2,
          height: 96,
          margin: 12,
          displayValue: true,
          fontSize: 18,
        });
      } catch {
        // Numeric/text fallback remains visible below.
      }
    }
  }, [code, format]);

  if (!code) return null;

  return (
    <div className="barcode-visual">
      {qrUrl ? <img src={qrUrl} alt="QR kód karty" /> : <svg ref={svgRef} aria-label="Čárový kód karty" />}
      <div className="barcode-caption">Kód pro načtení u pokladny</div>
    </div>
  );
}

function Done({
  card,
  onHome,
}: {
  card: SavedCard;
  onHome: () => void;
}) {
  const [message, setMessage] = useState("");

  const share = async () => {
    const text = [card.name, card.type, card.code ? "Kód: " + card.code : ""].filter(Boolean).join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: card.name, text });
        setMessage("Sdílení bylo otevřeno.");
      } else {
        await navigator.clipboard.writeText(text);
        setMessage("Údaje karty byly zkopírovány.");
      }
    } catch {
      setMessage("");
    }
  };

  const wallet = () => {
    setMessage("Skutečný Apple Wallet pass vyžaduje podepsaný .pkpass z Apple Developer účtu. V tomto webovém buildu jej zatím nefingujeme.");
  };

  return (
    <main className="flow-screen done-screen">
      <section className="flow-card done-card">
        <div className="done-mark">✓</div>
        <div className="done-eyebrow">Karta je připravená</div>
        <h2>{card.name}</h2>
        <p>{card.type}</p>
        {card.code && (<><BarcodeVisual code={card.code} format={card.codeFormat} /><div className="code-box raw-code">{card.code}</div></>)}

        <button className="wallet-button" type="button" onClick={wallet}> Přidat do Apple Wallet</button>
        <button className="secondary full" type="button" onClick={share}>Sdílet kartu</button>
        <button className="text-button" type="button" onClick={onHome}>Zpět na domovskou obrazovku</button>
        {message && <div className="truth-note">{message}</div>}
      </section>
    </main>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [savedCards, setSavedCards] = useState<SavedCard[]>(() => readSavedCards());
  const [lastCard, setLastCard] = useState<SavedCard | null>(null);
  const [draft, setDraft] = useState<Draft>({
    firstImage: "",
    secondImage: "",
    brand: "",
    type: "Věrnostní karta",
    code: "",
    codeFormat: "",
    codeSource: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCards));
  }, [savedCards]);

  const patchDraft = (next: Partial<Draft>) => setDraft((current) => ({ ...current, ...next }));

  const start = () => {
    setDraft({ firstImage: "", secondImage: "", brand: "", type: "Věrnostní karta", code: "", codeFormat: "", codeSource: "" });
    setScreen("first");
  };

  const save = () => {
    const name = draft.brand.trim();
    if (!name) return;
    const card: SavedCard = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      brand: name,
      name,
      type: draft.type.trim() || "Věrnostní karta",
      code: draft.code.trim(),
      codeFormat: draft.codeFormat,
      status: "ready",
    };
    setSavedCards((current) => [card, ...current]);
    setLastCard(card);
    setScreen("done");
  };

  if (screen === "home") return <Home onAdd={start} savedCards={savedCards} />;
  if (screen === "first") return <FirstSide draft={draft} onDraft={patchDraft} onBack={() => setScreen("home")} onNext={() => setScreen("second")} />;
  if (screen === "second") return <SecondSide draft={draft} onDraft={patchDraft} onBack={() => setScreen("first")} onNext={() => setScreen("review")} />;
  if (screen === "review") return <Review draft={draft} onDraft={patchDraft} onBack={() => setScreen("second")} onSave={save} />;
  if (screen === "done" && lastCard) return <Done card={lastCard} onHome={() => setScreen("home")} />;
  return <Home onAdd={start} savedCards={savedCards} />;
}
