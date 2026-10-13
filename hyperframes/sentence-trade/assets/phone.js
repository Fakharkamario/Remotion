// The Trade screen from the supplied screenshot, rebuilt in DOM at iPhone point size (430 x 932 pt)
// with the search keyboard open. Positions are measured off the 1290 x 2512 screenshot (px / 3 = pt).
(function () {
  const P = {};
  P.W = 430;
  P.H = 932;
  P.ICON = 40; // row icon size, pt
  P.ICON_X = 16;
  P.ROW0 = 199.3; // first row icon top, pt
  P.PITCH = 76; // row pitch, pt
  P.COMPOSER = 585; // top of the input bar above the keyboard, pt

  P.rows = [
    { key: "solana", name: "Solana", vol: "$657.02M vol", price: 108.09, dp: 2, pct: -0.23, spark: 268, seed: 3 },
    { key: "bitcoin", name: "Bitcoin", vol: "$41.57M vol", price: 83402.02, dp: 2, pct: 0.5, spark: 246, seed: 7 },
    { key: "ethereum", name: "Ethereum", vol: "$21.79M vol", price: 2516.0, dp: 2, pct: 0.21, spark: 255, seed: 11 },
    { key: "zcash", name: "Zcash", vol: "$18.72M vol", price: 1215.1, dp: 2, pct: -1.2, spark: 255, seed: 5 },
    { key: "hyperliquid", name: "Hyperliquid", vol: "$14.39M vol", price: 82.66, dp: 2, pct: -0.53, spark: 278, seed: 13 },
    { key: "near", name: "NEAR Protocol", vol: "$7.58M vol", price: 5.35, dp: 2, pct: -0.53, spark: 282, seed: 17 },
    { key: "trump", name: "Official Trump", vol: "$6.90M vol", price: 1.92, dp: 2, pct: 0.32, spark: 282, seed: 19 },
    { key: "raydium", name: "Raydium", vol: "$3.74M vol", price: 2.15, dp: 2, pct: -2.24, spark: 282, seed: 23 },
  ];

  // seeded noise for the sparklines
  function rng(seed) {
    let s = seed * 9301 + 49297;
    return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  }

  // Every sparkline in the screenshot has the same day shape: a wobble, a sharp dip around 65%, recovery.
  function spark(seed, up) {
    const r = rng(seed);
    const n = 64, pts = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      let y = 0.38 + 0.12 * Math.sin(u * 9 + seed) * (u < 0.55 ? 1 : 0.3);
      y += 0.62 * Math.exp(-Math.pow((u - 0.64) / 0.07, 2));
      if (u > 0.64) y -= (u - 0.64) * (up ? 1.2 : 0.9);
      y += (r() - 0.5) * 0.09;
      pts.push([u * 72, 4 + Math.max(0, Math.min(1, y)) * 24]);
    }
    return pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
  }

  P.fmt = function (v, dp) {
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  };

  P.iconHTML = function (key, cls) {
    const g = LOGOS[key];
    return `<div class="${cls}" style="background:${g.bg}">${LOGOS.art(key)}</div>`;
  };

  const KEYS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  P.build = function (host) {
    const rows = P.rows.map((r, i) => {
      const top = P.ROW0 + i * P.PITCH;
      const up = r.pct >= 0;
      return `<div class="row" style="top:${top}px">
        <div class="ic-slot" data-i="${i}">${P.iconHTML(r.key, "ic")}</div>
        <div class="nm">${r.name}</div><div class="vol">${r.vol}</div>
        <svg class="spark" style="left:${r.spark}px" viewBox="0 0 72 32"><path d="${spark(r.seed, up)}" fill="none" stroke="${up ? "#4f8c68" : "#bf6a5e"}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>
        <div class="px">${P.fmt(r.price, r.dp)}</div>
        <div class="pc ${up ? "up" : "dn"}"><span class="ar">${up ? "↗" : "↘"}</span><span class="pv">${Math.abs(r.pct).toFixed(2)}%</span></div>
      </div>`;
    }).join("");

    const keyRow = (s, cls) => `<div class="krow ${cls || ""}">${[...s].map((c) => `<div class="key">${c}</div>`).join("")}</div>`;

    host.innerHTML = `
      <div class="phone">
        <div class="screen">
          <svg class="status" viewBox="0 0 430 54" width="430" height="54">
            <!-- measured off the 1290 px screenshot (px / 3 = pt) -->
            <text x="47.4" y="36.2" class="sb-time">10:06</text>
            <g transform="translate(99.6 22.2)">
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
              <!-- battery: 66% fill, bold level centred across the body, nub -->
              <defs><clipPath id="sb-batt"><rect width="28.3" height="14.9" rx="4.4"/></clipPath></defs>
              <g clip-path="url(#sb-batt)">
                <rect width="28.3" height="14.9" fill="#b3b2ae"/>
                <rect width="18.4" height="14.9" fill="#111"/>
              </g>
              <path d="M29.3 5.1c1 .3 1.6 1.2 1.6 2.35s-.6 2.05-1.6 2.35z" fill="#b3b2ae"/>
              <text x="14.15" y="11.35" class="sb-batt">66</text>
            </g>
          </svg>
          <div class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7" fill="none" stroke="#666" stroke-width="2"/><path d="M15.8 15.8 21 21" stroke="#666" stroke-width="2" stroke-linecap="round"/></svg><span>Search or paste mint</span></div>
          <div class="chips"><span class="on">Crypto</span><span>Stocks</span><span>ETFs</span><span>Metals</span><span>Treasuries</span><span>Currencies</span></div>
          <div class="list">${rows}</div>
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
          <div class="home-ind"></div>
        </div>
      </div>`;

    return {
      phone: host.querySelector(".phone"),
      slots: [...host.querySelectorAll(".ic-slot")],
      prices: [...host.querySelectorAll(".px")],
      pcts: [...host.querySelectorAll(".pv")],
      typed: host.querySelector(".typed"),
      ph: host.querySelector(".ph"),
      caret: host.querySelector(".caret"),
    };
  };

  window.PHONE = P;
})();
