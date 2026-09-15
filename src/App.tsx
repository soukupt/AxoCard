import { useMemo, useState } from "react";
import "./styles.css";

type Screen = "home" | "first";

type CardStatus = "wallet" | "ready" | "none";

const cards = [
  { brand: "TESCO", name: "Tesco Clubcard", type: "Věrnostní karta", status: "wallet" as CardStatus },
  { brand: "K", name: "Kaufland Card", type: "Věrnostní karta", status: "wallet" as CardStatus },
  { brand: "BENU", name: "BENU", type: "Lékárna", status: "wallet" as CardStatus },
  { brand: "albert", name: "Albert", type: "Věrnostní karta", status: "ready" as CardStatus },
  { brand: "teta", name: "Teta", type: "Drogerie", status: "ready" as CardStatus },
  { brand: "MÖBELIX", name: "Möbelix", type: "Věrnostní karta", status: "none" as CardStatus },
  { brand: "BILLA", name: "BILLA Bonus Club", type: "Věrnostní karta", status: "wallet" as CardStatus },
  { brand: "IKEA", name: "IKEA Family", type: "Věrnostní karta", status: "ready" as CardStatus },
];

const FIGMA = {
  hero: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/4162d.png",
  heroDetail: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/91d52.png",
  logoMark: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/36096.png",
  settings: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/8c9f1.png",
  statusSignal: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/227b2.png",
  statusWifi: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/0bf45.png",
  statusBattery: "https://www.figma.com/api/mcp/asset/5e3b60db-f9c3-43ba-8aa4-a8024d3979a5/84c79.png",
  ctaBg: "https://www.figma.com/api/mcp/asset/4235d32c-4e6e-447e-bfc8-f12398916349/0bb77.png",
  ctaArrow: "https://www.figma.com/api/mcp/asset/4235d32c-4e6e-447e-bfc8-f12398916349/d380e.png",
  ctaCamera: "https://www.figma.com/api/mcp/asset/4235d32c-4e6e-447e-bfc8-f12398916349/43a6c.png",
};

function Status({ status }: { status: CardStatus }) {
  if (status === "wallet") return <span className="status wallet">● <span>V Apple Wallet</span></span>;
  if (status === "ready") return <span className="status ready">◷ <span>Připraveno přidat</span></span>;
  return <span className="status none">⊖ <span>Nevytvořeno</span></span>;
}

function CardLogo({ brand }: { brand: string }) {
  const cls = brand.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return <div className={"card-logo " + cls}>{brand}</div>;
}

function Home({ onAdd }: { onAdd: () => void }) {
  const [sortAsc, setSortAsc] = useState(true);
  const sorted = useMemo(
    () => [...cards].sort((a,b) => sortAsc ? a.name.localeCompare(b.name, "cs") : b.name.localeCompare(a.name, "cs")),
    [sortAsc],
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
          <div className="list-title">Připravené pro Apple Wallet <span className="count">8</span></div>
          <button type="button" className="sort" onClick={() => setSortAsc(v => !v)}>Seřadit ⇅</button>
        </div>
        <div className="rows">
          {sorted.map((card) => (
            <button className="card-row" type="button" key={card.name}>
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

function FirstSide({ onBack }: { onBack: () => void }) {
  return (
    <main className="flow-screen">
      <button className="back" type="button" onClick={onBack}>‹</button>
      <div className="flow-kicker">Přidat kartu · 1 z 3</div>
      <h2>První strana karty</h2>
      <p>Vyfoť nebo vyber první stranu karty. Tato strana je povinná.</p>
      <label className="dropzone">
        <input type="file" accept="image/*" capture="environment" />
        <strong>Vyfotit první stranu</strong>
        <span>nebo vybrat z galerie</span>
      </label>
    </main>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  return screen === "home"
    ? <Home onAdd={() => setScreen("first")} />
    : <FirstSide onBack={() => setScreen("home")} />;
}
