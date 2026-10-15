// The acend desktop trade screen (Markets > Solana) from the supplied screenshot, rebuilt in DOM at its own
// pixel size (1920 x 894). Positions are measured off the screenshot. A floating "Ask AI" bar is added at the
// bottom centre: it slides up at the end of the clip and the prompt is typed into it.
(function () {
  const D = {};
  D.W = 1920;
  D.H = 894;
  D.ICON = 26; // token icon size in the list / header, px
  D.ASK = { x: 960, y: 806 }; // centre of the Ask AI bar, px

  // token list: the first four rows are where the coins land (SOL is the open market, highlighted)
  D.rows = [
    { key: "bitcoin", sym: "BTC", price: "$80,820.62", pct: -0.86 },
    { key: "solana", sym: "SOL", price: "$102.06", pct: -2.25 },
    { key: "ethereum", sym: "ETH", price: "$3,104.57", pct: -1.92 },
    { key: "zcash", sym: "ZEC", price: "$1,088.13", pct: -4.24 },
    { key: "hyperliquid", sym: "HYPE", price: "$79.79", pct: -1.31 },
    { key: "near", sym: "NEAR", price: "$4.61", pct: -4.74 },
    { key: "uni", sym: "UNI", price: "$6.98", pct: -3.2 },
    { key: "aave", sym: "AAVE", price: "$149.38", pct: -2.6 },
    { key: "lit", sym: "LIT", price: "$2.98", pct: -3.95 },
    { key: "bnb", sym: "BNB", price: "$715.78", pct: -1.34 },
  ];
  D.ROW = { y0: 357.5, pitch: 56.3, iconX: 46 };
  D.iconCenter = (i) => ({ x: D.ROW.iconX, y: D.ROW.y0 + i * D.ROW.pitch });

  // list-only token marks (no coin for these)
  const MINI = {
    uni: { bg: "#fde8f1", svg: `<svg viewBox="0 0 100 100"><path d="M34 70c4-14 2-24 10-32 6-6 16-6 20 2 3 6 0 12-6 14 6 4 8 12 2 18-6 5-18 4-26-2z" fill="#ff007a" opacity=".85"/></svg>` },
    aave: { bg: "#ecebfa", svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#9c8ee6"/><path d="M36 64 50 34l14 30M41 54h18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
    lit: { bg: "#151517", svg: `<svg viewBox="0 0 100 100"><path d="M40 26v48h26" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M52 26 62 26 50 62z" fill="#fff"/></svg>` },
    bnb: { bg: "#151517", svg: `<svg viewBox="0 0 100 100"><g fill="#f0b90b"><path d="M50 22 60 32 50 42 40 32z"/><path d="M50 58 60 68 50 78 40 68z"/><path d="M28 50 36 42 44 50 36 58z"/><path d="M72 50 64 42 56 50 64 58z"/><path d="M50 43 57 50 50 57 43 50z"/></g></svg>` },
    usdc: { bg: "#2775ca", svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="5"/><path d="M58 40c-1-4-4-6-8-6-5 0-8 3-8 6 0 9 17 5 17 14 0 4-4 7-9 7-5 0-8-2-9-6M50 28v6M50 61v7" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>` },
  };
  D.iconHTML = function (key, cls) {
    const g = LOGOS[key] || MINI[key];
    const art = LOGOS[key] ? LOGOS.art(key) : g.svg;
    return `<div class="${cls}" style="background:${g.bg}">${art}</div>`;
  };

  // ---- the 30m candles: a deterministic walk through the screenshot's shape
  function candles() {
    const shape = [[0, 100.4], [0.04, 102.6], [0.1, 106.6], [0.13, 107.7], [0.17, 106.5], [0.3, 106.6], [0.5, 107.0],
      [0.58, 107.3], [0.64, 106.6], [0.66, 104.3], [0.72, 103.7], [0.88, 103.9], [0.9, 101.6], [0.93, 102.9], [0.96, 103.6], [1, 102.06]];
    const at = (u) => { let i = 0; while (u > shape[i + 1][0]) i++; const a = shape[i], b = shape[i + 1]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); };
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const N = 96, out = [];
    let prev = at(0);
    for (let i = 0; i < N; i++) {
      const u = (i + 1) / N, close = at(u) + (rnd() - 0.5) * 0.9 * (i === N - 1 ? 0 : 1);
      const open = prev, hi = Math.max(open, close) + rnd() * 0.45, lo = Math.min(open, close) - rnd() * 0.45 - (u > 0.87 && u < 0.93 ? 1.6 * rnd() : 0);
      out.push({ open, close, hi, lo });
      prev = close;
    }
    return out;
  }
  const py = (p) => 294 + (108 - p) * 14.5;

  const ACTIVITY = [
    ["$101.82", "102.06", 0, "11:28:49"], ["$204.09", "102.06", 0, "11:28:48"], ["$246.96", "102.05", 1, "11:28:47"],
    ["$1,920.52", "102.05", 1, "11:28:47"], ["$299.93", "102.05", 1, "11:28:48"], ["$499.83", "102.06", 1, "11:28:48"],
  ];
  const STATS = [["Bid", "$102.0122", 1104], ["Ask", "$102.1142", 1241], ["Spread", "$0.1021", 1351], ["Volume", "$614.57M", 1482],
    ["Trades", "2,014,060", 1610], ["High", "$104.4842", 1746], ["Low", "$101.5567", 1883]];

  const arrow = (up) => `<svg viewBox="0 0 12 12"><path d="${up ? "M6 10.5V2M2.5 5.5 6 2l3.5 3.5" : "M6 1.5V10M2.5 6.5 6 10l3.5-3.5"}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  D.build = function (host) {
    const cs = candles();
    const x0 = 360, dx = 9.9;
    const cHTML = cs.map((c, i) => {
      const up = c.close >= c.open, x = x0 + i * dx;
      const top = py(Math.max(c.open, c.close)), h = Math.max(1.5, Math.abs(py(c.open) - py(c.close)));
      return `<div class="wick ${up ? "g" : "r"}" style="left:${(x + 3.2).toFixed(1)}px;top:${py(c.hi).toFixed(1)}px;height:${(py(c.lo) - py(c.hi)).toFixed(1)}px"></div>` +
        `<div class="body ${up ? "g" : "r"}" style="left:${x.toFixed(1)}px;top:${top.toFixed(1)}px;height:${h.toFixed(1)}px"></div>`;
    }).join("");

    const rows = D.rows.map((r, i) => `
      <div class="trow${r.key === "solana" ? " on" : ""}" style="top:${(D.ROW.y0 + i * D.ROW.pitch - 26.5).toFixed(1)}px">
        <div class="ic-slot">${D.iconHTML(r.key, "ic")}</div>
        <span class="sym">${r.sym}</span><span class="pr">${r.price}</span><span class="ch">-${Math.abs(r.pct).toFixed(2)}%</span>
      </div>`).join("");

    const stats = STATS.map(([l, v, x]) => `<div class="stat" style="right:${D.W - x}px"><span>${l}</span><b>${v}</b></div>`).join("");
    const acts = ACTIVITY.map(([a, p, up, t], i) => `
      <div class="arow" style="top:${(696 + i * 33).toFixed(0)}px"><span class="am">${a}</span>
        <span class="ap ${up ? "g" : "r"}">${arrow(up)}${p}</span><span class="at">${t}</span></div>`).join("");

    host.innerHTML = `
      <div class="desk">
        <div class="nav">
          <svg class="mark" viewBox="0 0 40 40"><circle cx="18" cy="21" r="13" fill="none" stroke="#2a2a2c" stroke-width="5.5"/><rect x="29" y="5" width="5.5" height="31" rx="1.2" fill="#2a2a2c"/></svg>
          <div class="tabs"><span class="on">Markets</span><span>Portfolio</span><span><i class="sp">✦</i>Launches</span><span>AI</span></div>
          <svg class="gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" fill="none" stroke="#555" stroke-width="1.6"/><path d="M12 2.8l1.6 2.3 2.7-.8.6 2.8 2.7 1-.9 2.7 1.9 2-2 2 .9 2.7-2.7 1-.6 2.8-2.7-.8L12 21.2l-1.6-2.3-2.7.8-.6-2.8-2.7-1 .9-2.7-1.9-2 1.9-2-.9-2.7 2.7-1 .6-2.8 2.7.8z" fill="none" stroke="#555" stroke-width="1.5" stroke-linejoin="round"/></svg>
          <div class="bal" style="left:1256px">${D.iconHTML("solana", "bic")}<span>$0.00</span></div>
          <div class="bal" style="left:1374px">${D.iconHTML("usdc", "bic round")}<span>$0.00</span></div>
          <div class="btn" style="left:1493px;width:112px">Deposit</div>
          <div class="btn" style="left:1618px;width:129px">Withdraw</div>
          <div class="btn dark" style="left:1760px;width:142px">Account</div>
        </div>

        <div class="panel head">
          <div class="px"><span class="big">$102.06</span><span class="neg">-2.25%</span><span class="pill">Indicative</span></div>
          <div class="nm"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="none" stroke="#555" stroke-width="1.5" stroke-linejoin="round"/></svg>
            <div class="ic-slot hic">${D.iconHTML("solana", "ic")}</div><span>Solana</span></div>
          ${stats}
        </div>

        <div class="panel list">
          <div class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#666" stroke-width="1.8"/><path d="M15.5 15.5 20 20" stroke="#666" stroke-width="1.8" stroke-linecap="round"/></svg><span>Search or paste mint</span></div>
          <div class="lh"><span>Token</span><span style="left:190px">Price</span><span style="left:283px">24h</span></div>
          <div class="cat">CRYPTO</div>
        </div>
        <div class="rows">${rows}</div>

        <div class="panel chart">
          <div class="tf"><span>1m</span><span>5m</span><span>15m</span><span class="on">30m</span><span>1H</span><span>4H</span><span>1D</span></div>
        </div>

        <div class="plot"></div>
        <div class="grid" style="top:294px"></div><div class="grid" style="top:352px"></div><div class="grid" style="top:410px"></div>
        <div class="grid dot" style="top:380px"></div>
        ${cHTML}
        <div class="ylab" style="top:294px">108.00</div><div class="ylab" style="top:352px">104.00</div><div class="ylab" style="top:410px">100.00</div>
        <div class="cur">102.06</div>
        <div class="xlab" style="left:548px">12:00</div><div class="xlab b" style="left:764px">Oct 14</div>
        <div class="xlab" style="left:980px">12:00</div><div class="xlab b" style="left:1196px">Oct 15</div>

        <div class="panel act">
          <div class="atabs"><span class="on">Activity</span><span>Flow</span><span>Holders</span><span>Traders</span><span>Security</span><span>Orders</span></div>
          <svg class="flow" viewBox="0 0 1056 70" preserveAspectRatio="none">
            <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8c68" stop-opacity=".28"/><stop offset="1" stop-color="#4f8c68" stop-opacity=".03"/></linearGradient>
              <linearGradient id="fr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0605a" stop-opacity=".28"/><stop offset="1" stop-color="#b0605a" stop-opacity=".03"/></linearGradient></defs>
            <path d="M0 2H30L50 9H220L236 25L350 28L460 40L480 52L482 66H0Z" fill="url(#fg)"/>
            <path d="M0 2H30L50 9H220L236 25L350 28L460 40L480 64" fill="none" stroke="#4f8c68" stroke-width="2.2"/>
            <path d="M482 64H880L958 60L968 2H1056V66H482Z" fill="url(#fr)"/>
            <path d="M480 64H880L958 60L968 2H1056" fill="none" stroke="#b0605a" stroke-width="2.2"/>
            <path d="M481 0V70" stroke="#ddd" stroke-width="1"/>
          </svg>
          <div class="th"><span>Amount (USD) ⇄</span><span class="thc">Price</span><span class="thr">Time</span></div>
        </div>
        <div class="acts">${acts}</div>

        <div class="panel trade">
          <div class="seg s1"><span class="buy">Buy</span><span>Sell</span></div>
          <div class="seg s2"><span class="on">Market</span><span>Limit</span></div>
          <div class="amt"><span class="l">Amount</span><span class="v">0.00</span><span class="u">USD ⇄</span></div>
          <div class="pcts"><span>25%</span><span>50%</span><span>Max</span></div>
          <svg class="donut" viewBox="0 0 72 72"><circle cx="36" cy="36" r="31" fill="none" stroke="#e6e5e1" stroke-width="7"/>
            <circle cx="36" cy="36" r="31" fill="none" stroke="#4f8c68" stroke-width="7" pathLength="100" stroke-dasharray="35 65" transform="rotate(-90 36 36)"/>
            <circle cx="36" cy="36" r="31" fill="none" stroke="#b0605a" stroke-width="7" pathLength="100" stroke-dasharray="15 85" stroke-dashoffset="15" transform="rotate(-90 36 36)"/>
            <text x="36" y="40.5" text-anchor="middle">50%</text></svg>
          <div class="leg" style="top:372px"><i style="background:#4f8c68"></i>Higher<b>35%</b></div>
          <div class="leg" style="top:399px"><i style="background:#d4d3cf"></i>Steady<b>50%</b></div>
          <div class="leg" style="top:425px"><i style="background:#b0605a"></i>Lower<b>15%</b></div>
          <div class="hn">Happening now</div>
          <div class="news">Solana declined <b>0.56%</b> over the past 24 hours to <b>$104.27.</b> The network has scheduled an upgrade called <b>Alpenglow</b> for late October that aims to…</div>
          <div class="rm">Read more</div><div class="askpill">Ask AI</div>
        </div>

        <div class="askbar">
          <svg class="spk" viewBox="0 0 24 24"><path d="M10 3 11.8 8.2 17 10 11.8 11.8 10 17 8.2 11.8 3 10 8.2 8.2Z" fill="none" stroke="#4f8c68" stroke-width="1.7" stroke-linejoin="round"/><path d="M18 3.5v4M16 5.5h4" stroke="#4f8c68" stroke-width="1.7" stroke-linecap="round"/></svg>
          <div class="field"><span class="ph">Ask AI to make a trade</span><span class="typed"></span><span class="caret"></span></div>
          <div class="send"><svg viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
      </div>`;

    return {
      slots: [...host.querySelectorAll(".rows .ic-slot")],
      headIcon: host.querySelector(".hic"),
      chs: [...host.querySelectorAll(".rows .ch")],
      big: host.querySelector(".big"),
      cur: host.querySelector(".cur"),
      ask: host.querySelector(".askbar"),
      typed: host.querySelector(".typed"),
      ph: host.querySelector(".ph"),
      caret: host.querySelector(".caret"),
      send: host.querySelector(".send"),
    };
  };

  window.DESK = D;
})();
