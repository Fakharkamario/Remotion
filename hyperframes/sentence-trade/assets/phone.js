// The Explore screen from the supplied screenshot, rebuilt in DOM at iPhone point size (430 x 932 pt)
// with the AI keyboard open below the fold. Positions are measured off the 1290 x 2517 screenshot (px / 3 = pt).
(function () {
  const P = {};
  P.W = 430;
  P.H = 932;
  P.ICON = 40; // card icon size, pt
  P.COMPOSER = 585; // top of the input bar above the keyboard, pt

  // "Most popular" cards, 2 per row; the first four are the landing spots for the coins
  P.CARD = { x: [20.6, 221.5], y0: 370.8, pitch: 180, w: 187.9, h: 167.4 };
  P.cards = [
    { key: "solana", name: "Solana", pct: -0.09 },
    { key: "bitcoin", name: "Bitcoin", pct: 0.1 },
    { key: "ethereum", name: "Ethereum", pct: 0.19 },
    { key: "zcash", name: "Zcash", pct: -1.03 },
    { key: "hyperliquid", name: "Hyperliquid", pct: -0.48 },
    { key: "near", name: "NEAR Protocol", pct: -0.21 },
  ];
  P.iconCenter = (i) => ({
    x: P.CARD.x[i % 2] + 13.4 + P.ICON / 2,
    y: P.CARD.y0 + Math.floor(i / 2) * P.CARD.pitch + 13.9 + P.ICON / 2,
  });

  P.fmt = function (v, dp) {
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  };

  P.iconHTML = function (key, cls) {
    const g = LOGOS[key];
    return `<div class="${cls}" style="background:${g.bg}">${LOGOS.art(key)}</div>`;
  };

  const KEYS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  // category glyphs, 24 x 24, stroked
  const CAT = {
    crypto: `<path d="M9 5v14M12.5 5v2M12.5 17v2M7 7h7.2a3 3 0 0 1 0 6H7m0 0h7.8a3 3 0 0 1 0 6H7" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" transform="skewX(-12) translate(2.4 -0.6)"/>`,
    stocks: `<path d="M4 20V8.5l7-3V20M11 9.5h8.5V20M2.5 20h19M7 10.5h1.5M7 14h1.5M14.5 13h2M14.5 16.5h2M7 17.5h1.5" fill="none" stroke="#5f5f5d" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    etfs: `<path d="M12 3.5 21 8l-9 4.5L3 8z M3 12l9 4.5 9-4.5 M3 16l9 4.5 9-4.5" fill="none" stroke="#5f5f5d" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`,
    metals: `<path d="M7 4.5h10l4 5-9 10.5L3 9.5z M3 9.5h18 M9.5 4.5 8 9.5l4 10.5 4-10.5-1.5-5" fill="none" stroke="#5f5f5d" stroke-width="1.6" stroke-linejoin="round"/>`,
    treasuries: `<path d="M3.5 9 12 4.5 20.5 9z M5.5 11v7 M9.5 11v7 M14.5 11v7 M18.5 11v7 M3.5 20.5h17 M4.5 9h15" fill="none" stroke="#5f5f5d" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    currencies: `<circle cx="12" cy="12" r="8" fill="none" stroke="#5f5f5d" stroke-width="1.6"/>`,
  };
  const CATS = [["crypto", "Crypto"], ["stocks", "Stocks"], ["etfs", "ETFs"], ["metals", "Metals"], ["treasuries", "Treasuries"], ["currencies", "Currencies"]];
  const CAT_X = [49.9, 130, 209.8, 289.9, 370, 450];

  P.build = function (host) {
    const cats = CATS.map(([k, label], i) => `
      <div class="cat${i ? "" : " on"}" style="left:${CAT_X[i] - 27.9}px"><svg viewBox="0 0 24 24">${CAT[k]}</svg></div>
      <div class="cat-l${i ? "" : " on"}" style="${i < 5 ? `left:${CAT_X[i] - 50}px` : "left:418.7px;text-align:left"}">${label}</div>`).join("");

    const cards = P.cards.map((c, i) => {
      const up = c.pct >= 0;
      return `<div class="card" style="left:${P.CARD.x[i % 2]}px;top:${P.CARD.y0 + Math.floor(i / 2) * P.CARD.pitch}px">
        <div class="ic-slot">${P.iconHTML(c.key, "ic")}</div>
        <div class="nm">${c.name}</div>
        <div class="pc ${up ? "up" : "dn"}"><svg class="ar" viewBox="0 0 12 12"><path d="${up ? "M3 9 9 3M4 3h5v5" : "M3 3l6 6M4 9h5V4"}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="pv">${Math.abs(c.pct).toFixed(2)}%</span></div>
      </div>`;
    }).join("");

    const keyRow = (s, cls) => `<div class="krow ${cls || ""}">${[...s].map((c) => `<div class="key">${c}</div>`).join("")}</div>`;

    host.innerHTML = `
      <div class="phone">
        <div class="screen">
          <svg class="status" viewBox="0 0 430 54" width="430" height="54">
            <!-- measured off the 1290 px screenshot (px / 3 = pt) -->
            <text x="52.4" y="36.2" class="sb-time">5:29</text>
            <g transform="translate(94.8 22.2)">
              <!-- bell with slash -->
              <path d="M7.2 1.2c-2.6 0-4.5 2-4.5 4.6v3.1c0 .9-.3 1.7-.9 2.4l-.8 1c-.3.4 0 1 .5 1h11.4c.5 0 .8-.6.5-1l-.8-1c-.6-.7-.9-1.5-.9-2.4V5.8c0-2.6-1.9-4.6-4.5-4.6z" fill="#111"/>
              <path d="M5.1 14.2a2.2 2.2 0 0 0 4.2 0z" fill="#111"/>
              <path d="M0.4 0.9 14.1 14.6" stroke="#f9f8f4" stroke-width="3.6" stroke-linecap="round"/>
              <path d="M1.1 1.6 13.4 13.9" stroke="#111" stroke-width="1.55" stroke-linecap="round"/>
            </g>
            <g transform="translate(329.6 35.4)" fill="#111">
              <!-- wifi: three wedge arcs about a common origin -->
              <path d="M0 0 -3.1 -3.1A4.4 4.4 0 0 1 3.1 -3.1Z"/>
              <path d="M-4.6 -4.6A6.5 6.5 0 0 1 4.6 -4.6L6.3 -6.3A8.9 8.9 0 0 0 -6.3 -6.3Z"/>
              <path d="M-7.8 -7.8A11 11 0 0 1 7.8 -7.8L9.5 -9.5A13.4 13.4 0 0 0 -9.5 -9.5Z"/>
            </g>
            <g transform="translate(346.7 21.4)">
              <!-- battery: 56% fill, bold level centred across the body, nub -->
              <defs><clipPath id="sb-batt"><rect width="28.3" height="14.9" rx="4.4"/></clipPath></defs>
              <g clip-path="url(#sb-batt)">
                <rect width="28.3" height="14.9" fill="#b3b2ae"/>
                <rect width="15.8" height="14.9" fill="#111"/>
              </g>
              <path d="M29.3 5.1c1 .3 1.6 1.2 1.6 2.35s-.6 2.05-1.6 2.35z" fill="#b3b2ae"/>
              <text x="14.15" y="11.35" class="sb-batt">56</text>
            </g>
          </svg>
          <div class="avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="3.9" fill="none" stroke="#4a4a48" stroke-width="1.6"/><path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6" fill="none" stroke="#4a4a48" stroke-width="1.6" stroke-linecap="round"/></svg></div>
          ${cats}
          <div class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7" fill="none" stroke="#666" stroke-width="1.9"/><path d="M15.8 15.8 21 21" stroke="#666" stroke-width="1.9" stroke-linecap="round"/></svg><span>Search</span></div>
          <div class="sec-t">Most popular</div>
          <div class="sec-s">The highest value assets in the market</div>
          <div class="sec-b"><svg viewBox="0 0 24 24"><path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="#2a2a2a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div class="cards">${cards}</div>
          <div class="tabbar">
            <div class="tab"><svg viewBox="0 0 24 24"><path d="M4 10.2 12 4l8 6.2V20H14.5v-5.5h-5V20H4z" fill="none" stroke="#6b6b69" stroke-width="1.6" stroke-linejoin="round"/></svg><span>Home</span></div>
            <div class="tab on"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#1f1f1f" stroke-width="2"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z" fill="none" stroke="#1f1f1f" stroke-width="1.9" stroke-linejoin="round"/></svg><span>Explore</span></div>
            <div class="tab"><svg viewBox="0 0 24 24"><path d="M10 5.5 11.7 10.3 16.5 12 11.7 13.7 10 18.5 8.3 13.7 3.5 12 8.3 10.3Z" fill="none" stroke="#6b6b69" stroke-width="1.6" stroke-linejoin="round"/><path d="M18 3v4M16 5h4" stroke="#6b6b69" stroke-width="1.6" stroke-linecap="round"/><circle cx="5" cy="19.5" r="1.8" fill="none" stroke="#6b6b69" stroke-width="1.5"/></svg><span>AI</span></div>
            <div class="tab"><svg viewBox="0 0 24 24"><path d="M5 3.5h14v17l-2.3-1.4-2.4 1.4-2.3-1.4-2.3 1.4-2.4-1.4L5 20.5z" fill="none" stroke="#6b6b69" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.4 8.6c-.4-.8-1.3-1.2-2.4-1.2-1.4 0-2.4.7-2.4 1.8 0 2.4 5 1.3 5 3.8 0 1.1-1.1 1.9-2.6 1.9-1.2 0-2.2-.5-2.6-1.4M12 6v1.4M12 14.3v1.5" fill="none" stroke="#6b6b69" stroke-width="1.5" stroke-linecap="round"/></svg><span>Transactions</span></div>
          </div>
          <div class="kb-sheet">
          <div class="composer">
            <div class="field">
              <svg class="spk" viewBox="0 0 24 24"><path d="M10 3 11.8 8.2 17 10 11.8 11.8 10 17 8.2 11.8 3 10 8.2 8.2Z" fill="none" stroke="#555" stroke-width="1.6" stroke-linejoin="round"/><path d="M18 3.5v4M16 5.5h4" stroke="#555" stroke-width="1.6" stroke-linecap="round"/><circle cx="6" cy="19" r="2" fill="none" stroke="#555" stroke-width="1.6"/></svg>
              <span class="ph">Ask AI to make a trade</span><span class="typed"></span><span class="caret"></span>
            </div>
            <div class="send"><svg viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
          <div class="kbd">
            ${keyRow(KEYS[0])}${keyRow(KEYS[1], "mid")}
            <div class="krow"><div class="key fn">⇧</div>${[...KEYS[2]].map((c) => `<div class="key">${c}</div>`).join("")}<div class="key fn">⌫</div></div>
            <div class="krow last"><div class="key fn n123">123</div><div class="key space">space</div><div class="key go">Ask</div></div>
            <div class="kfoot"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#555" stroke-width="1.6"/><circle cx="9" cy="10" r="1.2" fill="#555"/><circle cx="15" cy="10" r="1.2" fill="#555"/><path d="M8 14.5c2.2 2.5 5.8 2.5 8 0" fill="none" stroke="#555" stroke-width="1.6" stroke-linecap="round"/></svg>
              <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="#555" stroke-width="1.6"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="#555" stroke-width="1.6" stroke-linecap="round"/></svg></div>
          </div>
          </div>
          <div class="home-ind"></div>
        </div>
      </div>`;

    return {
      phone: host.querySelector(".phone"),
      slots: [...host.querySelectorAll(".ic-slot")],
      pcts: [...host.querySelectorAll(".pv")],
      typed: host.querySelector(".typed"),
      ph: host.querySelector(".ph"),
      caret: host.querySelector(".caret"),
      sheet: host.querySelector(".kb-sheet"),
    };
  };

  window.PHONE = P;
})();
