import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
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
  status: CardStatus;
};

type Draft = {
  firstImage: string;
  secondImage: string;
  brand: string;
  type: string;
  code: string;
};

const DEMO_CARDS: SavedCard[] = [
  { id: "tesco", brand: "TESCO", name: "Tesco Clubcard", type: "Věrnostní karta", code: "", status: "wallet" },
  { id: "kaufland", brand: "K", name: "Kaufland Card", type: "Věrnostní karta", code: "", status: "wallet" },
  { id: "benu", brand: "BENU", name: "BENU", type: "Lékárna", code: "", status: "wallet" },
  { id: "albert", brand: "albert", name: "Albert", type: "Věrnostní karta", code: "", status: "ready" },
  { id: "teta", brand: "teta", name: "Teta", type: "Drogerie", code: "", status: "ready" },
  { id: "mobelix", brand: "MÖBELIX", name: "Möbelix", type: "Věrnostní karta", code: "", status: "none" },
  { id: "billa", brand: "BILLA", name: "BILLA Bonus Club", type: "Věrnostní karta", code: "", status: "wallet" },
  { id: "ikea", brand: "IKEA", name: "IKEA Family", type: "Věrnostní karta", code: "", status: "ready" },
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

async function tryReadProviderFromImage(file: File): Promise<string> {
  const filenameHit = inferProviderFromFilename(file);
  if (filenameHit) return filenameHit;

  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(file);
    await worker.terminate();

    const normalized = data.text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, " ");

    const hit = KNOWN_PROVIDERS.find((provider) => {
      const key = provider
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, " ");
      return normalized.includes(key);
    });

    return hit ?? "";
  } catch {
    return "";
  }
}

async function tryDetectBarcode(file: File): Promise<string> {
  const BarcodeDetectorCtor = (window as unknown as {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => {
      detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
    };
  }).BarcodeDetector;

  if (BarcodeDetectorCtor && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new BarcodeDetectorCtor({
        formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
      });
      const result = await detector.detect(bitmap);
      bitmap.close();
      const detected = result[0]?.rawValue?.trim() ?? "";
      if (detected) return detected;
    } catch {
      // Safari/iOS often does not expose BarcodeDetector; fall through to ZXing.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(url);
    return result.getText().trim();
  } catch {
    return "";
  } finally {
    URL.revokeObjectURL(url);
  }
}


async function recognizeCardSide(file: File): Promise<{ code: string; provider: string }> {
  const [code, provider] = await Promise.all([
    tryDetectBarcode(file),
    tryReadProviderFromImage(file),
  ]);
  return { code, provider };
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
    const { code, provider } = await recognizeCardSide(file);
    onDraft({
      firstImage: url,
      ...(code ? { code } : {}),
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
              ? [draft.code ? "Kód rozpoznán." : "", draft.brand ? `Poskytovatel: ${draft.brand}.` : ""].filter(Boolean).join(" ")
              : "AxoCard se pokusí přečíst kód i název poskytovatele přímo z fotografie."}
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
    const { code, provider } = await recognizeCardSide(file);

    onDraft({
      secondImage: url,
      ...(!draft.code && code ? { code } : {}),
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
              ? [draft.code ? "Kód rozpoznán." : "", draft.brand ? `Poskytovatel: ${draft.brand}.` : ""].filter(Boolean).join(" ")
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
          <input id="code" value={draft.code} onChange={(e) => onDraft({ code: e.target.value })} placeholder="Doplňte ručně, pokud nebyl rozpoznán" />
        </div>

        <div className="truth-note">
          AxoCard nevyplňuje falešný kód. Pokud se kód z fotografie nepodaří skutečně přečíst, zůstane pole prázdné.
        </div>

        <button className="primary" type="button" disabled={!canSave} onClick={onSave}>
          Vytvořit kartu
        </button>
      </section>
    </main>
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
        {card.code && <div className="code-box">{card.code}</div>}

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
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCards));
  }, [savedCards]);

  const patchDraft = (next: Partial<Draft>) => setDraft((current) => ({ ...current, ...next }));

  const start = () => {
    setDraft({ firstImage: "", secondImage: "", brand: "", type: "Věrnostní karta", code: "" });
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
