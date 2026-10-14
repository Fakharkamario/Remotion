// The Explore screen from the four supplied screenshots (Crypto, Stocks, ETFs, Pre-IPO), rebuilt in DOM at
// iPhone point size (430 x 932 pt). Positions are measured off the 1290 px wide screenshots (px / 3 = pt);
// card logos are cropped straight from them (assets/icons).
(function () {
  const U = {};
  U.W = 430;
  U.H = 932;

  // category circles: 56 pt, centres measured on the unscrolled row; the Pre-IPO screenshot shows the row
  // scrolled left by 149.8 pt
  U.CAT_Y = 160.7;
  U.CAT_X = [49.9, 130, 209.8, 289.9, 370, 450.3, 530.3];
  U.ROW_SCROLL = -149.8;
  U.CATS = ["crypto", "stocks", "etfs", "metals", "treasuries", "currencies", "preipo"];
  const LABEL = { crypto: "Crypto", stocks: "Stocks", etfs: "ETFs", metals: "Metals", treasuries: "Treasuries", currencies: "Currencies", preipo: "Pre-IPO" };

  // glyphs, 24 x 24, stroked with currentColor so selection can recolour them
  const GLYPH = {
    crypto: `<path d="M9 5v14M12.5 5v2M12.5 17v2M7 7h7.2a3 3 0 0 1 0 6H7m0 0h7.8a3 3 0 0 1 0 6H7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" transform="skewX(-12) translate(2.4 -0.6)"/>`,
    stocks: `<path d="M4 20V8.5l7-3V20M11 9.5h8.5V20M2.5 20h19M7 10.5h1.5M7 14h1.5M14.5 13h2M14.5 16.5h2M7 17.5h1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    etfs: `<path d="M12 3.5 21 8l-9 4.5L3 8z M3 12l9 4.5 9-4.5 M3 16l9 4.5 9-4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`,
    metals: `<path d="M7 4.5h10l4 5-9 10.5L3 9.5z M3 9.5h18 M9.5 4.5 8 9.5l4 10.5 4-10.5-1.5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
    treasuries: `<path d="M3.5 9 12 4.5 20.5 9z M5.5 11v7 M9.5 11v7 M14.5 11v7 M18.5 11v7 M3.5 20.5h17 M4.5 9h15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    currencies: `<path d="M16 7.5c-.7-1.4-2.2-2.2-4-2.2-2.3 0-4 1.2-4 3.1 0 4.2 8.4 2.3 8.4 6.5 0 2-1.9 3.3-4.4 3.3-2 0-3.7-.9-4.4-2.4M12 3v2.3M12 18.2v2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
    preipo: `<path d="M14.5 4.5c2.6-.9 4.4-.8 5-.2.6.6.7 2.4-.2 5-1 2.8-3.4 5.6-6.6 7.6l-3.6-3.6c2-3.2 4.8-5.6 5.4-8.8z M9.6 12.5 6 12l3-3.4 3.6.4 M11.5 14.4 12 18l3.4-3-.4-3.6 M7.4 15.6c-1.6.3-2.7 1.6-2.9 3.9 2.3-.2 3.6-1.3 3.9-2.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="15.6" cy="8.4" r="1.4" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  };

  // content per category; card tops are measured (gainers 370.8, losers 637.4, ETF losers 538.8 pt)
  const up = (v) => ({ v, up: true });
  const dn = (v) => ({ v, up: false });
  U.CONTENT = {
    crypto: [
      { kind: "head", y: 309.5, t: "Gainers", s: "Largest positive daily price changes", shared: true },
      { kind: "cards", y: 370.8, cards: [["pyth", "Pyth Network", up(3.36)], ["pons", "Pons", up(2.22)], ["tron", "TRON", up(0.59)]] },
      { kind: "head", y: 576.5, t: "Losers", s: "Largest daily price drops" },
      { kind: "cards", y: 637.4, cards: [["xmaquina", "XMAQUINA"], ["bome", "Book of Meme"], ["zcash", "Zcash"]] },
    ],
    stocks: [
      { kind: "head", y: 309.5, t: "Gainers", s: "Largest positive daily price changes", shared: true },
      { kind: "cards", y: 370.8, cards: [["moderna", "Moderna", up(3.19)], ["pfizer", "Pfizer", up(2.4)], ["lockheed", "Lockheed", up(1.8)]] },
      { kind: "head", y: 576.5, t: "Losers", s: "Largest daily price drops" },
      { kind: "cards", y: 637.4, cards: [["dell", "Dell\nTechnologies"], ["defidev", "DeFi\nDevelopment"], ["nebius", "Nebius Group"]] },
    ],
    etfs: [
      { kind: "head", y: 309.5, t: "Gainers", s: "Largest positive daily price changes", shared: true },
      { kind: "note", y: 391, t: "Nothing is up in this category." },
      { kind: "head", y: 477.5, t: "Losers", s: "Largest daily price drops" },
      { kind: "cards", y: 538.8, cards: [["tqqq", "TQQQ", dn(2.9)], ["roundhill", "Roundhill\nMemory ETF", dn(1.49)], ["invesco", "Invesco QQQ", dn(1.18)]] },
      { kind: "head", y: 741, t: "Most popular", s: "" },
    ],
    preipo: [
      { kind: "head", y: 309.5, t: "Gainers", s: "Largest positive daily price changes", shared: true },
      { kind: "cards", y: 370.8, cards: [["kalshi", "Kalshi", up(0.21)]] },
      { kind: "head", y: 576.5, t: "Losers", s: "Largest daily price drops" },
      { kind: "cards", y: 637.4, cards: [["neuralink", "Neuralink"], ["anduril", "Anduril"], ["figure", "Figure AI"]] },
    ],
  };
  U.CARD_X = [20.6, 179.5, 338.5];

  const arrow = (isUp) =>
    `<svg class="ar" viewBox="0 0 12 12"><path d="${isUp ? "M3 9 9 3M4 3h5v5" : "M3 3l6 6M4 9h5V4"}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const chevron = `<svg viewBox="0 0 24 24"><path d="M9.5 6.5 15 12l-5.5 5.5" fill="none" stroke="#2a2a2a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function block(cat) {
    // every section element is an animatable item (.it) so the swap can stagger them
    return U.CONTENT[cat].filter((sec) => !sec.shared).map((sec) => {
      if (sec.kind === "head")
        return `<div class="it sec" style="top:${sec.y}px"><div class="sec-t">${sec.t}</div>${sec.s ? `<div class="sec-s">${sec.s}</div>` : ""}<div class="sec-b">${chevron}</div></div>`;
      if (sec.kind === "note") return `<div class="it note" style="top:${sec.y}px">${sec.t}</div>`;
      return sec.cards.map(([icon, name, pct], i) => {
        const lines = name.split("\n");
        return `<div class="it card" style="left:${U.CARD_X[i]}px;top:${sec.y}px">
          <img class="ic" src="assets/icons/${icon}.png" alt="">
          <div class="nm${lines.length > 1 ? " two" : ""}">${lines.join("<br>")}</div>
          ${pct ? `<div class="pc ${pct.up ? "up" : "dn"}">${arrow(pct.up)}<span data-v="${pct.v}">${pct.v.toFixed(2)}%</span></div>` : ""}
        </div>`;
      }).join("");
    }).join("");
  }

  U.build = function (host) {
    // layers: grey discs, the dark selection puck (slides between them), glyphs, labels
    const discs = U.CATS.map((k, i) => `<div class="cdisc" style="left:${U.CAT_X[i] - 28}px"></div>`).join("");
    const glyphs = U.CATS.map((k, i) => `<div class="cglyph" style="left:${U.CAT_X[i] - 28}px"><svg viewBox="0 0 24 24">${GLYPH[k]}</svg></div>`).join("");
    const labels = U.CATS.map((k, i) => `<div class="cat-l" style="left:${U.CAT_X[i] - 50}px">${LABEL[k]}</div>`).join("");
    // tap halos bloom underneath the buttons (row points), so they glow around them
    const cats = `<div class="halo"></div>`.repeat(4) + discs + `<div class="puck"></div>` + glyphs + labels;
    const blocks = ["crypto", "stocks", "etfs", "preipo"].map((k) => `<div class="block" data-k="${k}">${block(k)}</div>`).join("");

    host.innerHTML = `
      <div class="phone"></div>
      <div class="screen">
        <svg class="status ui" viewBox="0 0 430 54" width="430" height="54">
          <text x="52.4" y="36.2" class="sb-time">7:54</text>
          <g transform="translate(94.8 22.2)">
            <path d="M7.2 1.2c-2.6 0-4.5 2-4.5 4.6v3.1c0 .9-.3 1.7-.9 2.4l-.8 1c-.3.4 0 1 .5 1h11.4c.5 0 .8-.6.5-1l-.8-1c-.6-.7-.9-1.5-.9-2.4V5.8c0-2.6-1.9-4.6-4.5-4.6z" fill="#111"/>
            <path d="M5.1 14.2a2.2 2.2 0 0 0 4.2 0z" fill="#111"/>
            <path d="M0.4 0.9 14.1 14.6" stroke="#f9f8f4" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M1.1 1.6 13.4 13.9" stroke="#111" stroke-width="1.55" stroke-linecap="round"/>
          </g>
          <g transform="translate(329.6 35.4)" fill="#111">
            <path d="M0 0 -3.1 -3.1A4.4 4.4 0 0 1 3.1 -3.1Z"/>
            <path d="M-4.6 -4.6A6.5 6.5 0 0 1 4.6 -4.6L6.3 -6.3A8.9 8.9 0 0 0 -6.3 -6.3Z"/>
            <path d="M-7.8 -7.8A11 11 0 0 1 7.8 -7.8L9.5 -9.5A13.4 13.4 0 0 0 -9.5 -9.5Z"/>
          </g>
          <g transform="translate(346.7 21.4)">
            <defs><clipPath id="sb-batt"><rect width="28.3" height="14.9" rx="4.4"/></clipPath></defs>
            <g clip-path="url(#sb-batt)"><rect width="28.3" height="14.9" fill="#b3b2ae"/><rect width="26.6" height="14.9" fill="#111"/></g>
            <path d="M29.3 5.1c1 .3 1.6 1.2 1.6 2.35s-.6 2.05-1.6 2.35z" fill="#b3b2ae"/>
            <text x="14.15" y="11.35" class="sb-batt">94</text>
          </g>
        </svg>
        <div class="avatar ui"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="3.9" fill="none" stroke="#4a4a48" stroke-width="1.6"/><path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6" fill="none" stroke="#4a4a48" stroke-width="1.6" stroke-linecap="round"/></svg></div>
        <div class="catrow">${cats}</div>
        <div class="search ui"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7" fill="none" stroke="#666" stroke-width="1.9"/><path d="M15.8 15.8 21 21" stroke="#666" stroke-width="1.9" stroke-linecap="round"/></svg><span>Search</span></div>
        <div class="content ui">
          <!-- "Gainers" sits in the same place on every category, so it stays put while the rest swaps -->
          <div class="sec" style="top:309.5px"><div class="sec-t">Gainers</div><div class="sec-s">Largest positive daily price changes</div><div class="sec-b">${chevron}</div></div>
          ${blocks}
        </div>
      </div>`;

    const q = (s) => [...host.querySelectorAll(s)];
    return {
      phone: host.querySelector(".phone"),
      screen: host.querySelector(".screen"),
      row: host.querySelector(".catrow"),
      discs: q(".cdisc"),
      glyphs: q(".cglyph"),
      puck: host.querySelector(".puck"),
      halos: q(".halo"),
      labels: q(".cat-l"),
      ui: q(".ui"),
      blocks: Object.fromEntries(q(".block").map((b) => [b.dataset.k, { el: b, items: [...b.querySelectorAll(".it")] }])),
    };
  };

  window.UI = U;
})();
