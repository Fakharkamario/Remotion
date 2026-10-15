// The acend desktop app from the supplied screenshots, rebuilt in DOM at its own pixel size (1920 x 900 window):
// the shared top bar with its settings menu, the Markets page (Solana, with the Favorites / Trending list; and
// Coca-Cola as "just ask" leaves it), the layout editor's handles and drop zone, and the Ask AI side panel.
// Positions are measured off the 1920 px wide screenshots (the top bar sits 8 px lower so the window's rounded
// corners clear it).
// Mock data for the video: $1,350.00 USDC in the account; the AI reply keeps $100 aside and splits the other
// $1,250 into three low-risk assets; the trade buys $375 of Coca-Cola (~4.00 KO at $93.76).
(function () {
  const D = {};
  D.W = 1920;
  D.H = 900;
  D.BALANCE = 1350;
  D.PROMPT = "Put my cash into low-risk assets";
  D.TRADE = { amt: 375, price: 93.7601, digits: "375" };

  // ---------------------------------------------------------------- geometry the scene needs (window px)
  D.TAB = { markets: { x: 72, w: 120 }, ai: { x: 493, w: 52 } }; // selected-tab pill
  D.AI_TAB = { x: 519, y: 32 };
  D.ACCOUNT = { x: 1760, y: 8, w: 142, h: 48 };
  D.INPUT = { x: 438, y: 810, w: 1044, h: 70 };
  D.SEND = { x: 1448, y: 845 };
  D.CARD0 = 352; D.CARD_PITCH = 106; D.CARD_H = 87;
  D.AMOUNT = { x: 1683, y: 426 }; // amount field (KO page), click point
  D.BUY = { x: 1683, y: 585 }; // Buy button (KO page)

  // ---------------------------------------------------------------- token marks
  const MINI = {
    usdc: { bg: "#2775ca", svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="5"/><path d="M58 40c-1-4-4-6-8-6-5 0-8 3-8 6 0 9 17 5 17 14 0 4-4 7-9 7-5 0-8-2-9-6M50 28v6M50 61v7" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>` },
    uni: { bg: "#fde8f1", svg: `<svg viewBox="0 0 100 100"><path d="M34 70c4-14 2-24 10-32 6-6 16-6 20 2 3 6 0 12-6 14 6 4 8 12 2 18-6 5-18 4-26-2z" fill="#ff007a" opacity=".85"/></svg>` },
    aave: { bg: "#ecebfa", svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#9c8ee6"/><path d="M36 64 50 34l14 30M41 54h18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
    lit: { bg: "#151517", svg: `<svg viewBox="0 0 100 100"><path d="M40 26v48h26" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M52 26 62 26 50 62z" fill="#fff"/></svg>` },
    bnb: { bg: "#151517", svg: `<svg viewBox="0 0 100 100"><g fill="#f0b90b"><path d="M50 22 60 32 50 42 40 32z"/><path d="M50 58 60 68 50 78 40 68z"/><path d="M28 50 36 42 44 50 36 58z"/><path d="M72 50 64 42 56 50 64 58z"/><path d="M50 43 57 50 50 57 43 50z"/></g></svg>` },
    xrp: { bg: "#151517", svg: `<svg viewBox="0 0 100 100"><path d="M28 28 50 50 72 28M28 72 50 50 72 72" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>` },
    tsla: { bg: "#e0312b", svg: `<svg viewBox="0 0 100 100"><path d="M24 30c16-6 36-6 52 0M50 36v38" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>` },
    mega: { bg: "#f3f2ee", svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#2a2a2c" stroke-width="6"/><path d="M36 64V38l14 16 14-16v26" fill="none" stroke="#2a2a2c" stroke-width="6" stroke-linejoin="round"/></svg>` },
    pyth: { bg: "#7b4fe0", svg: `<svg viewBox="0 0 100 100"><path d="M40 72V30h14a12 12 0 0 1 0 24H40" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/></svg>` },
    treasury: { bg: "#31302e", svg: `<svg viewBox="0 0 24 24"><g transform="translate(4.2 4.2) scale(.65)"><path d="M3.5 9 12 4.5 20.5 9z M5.5 11v7 M9.5 11v7 M14.5 11v7 M18.5 11v7 M3.5 20.5h17 M4.5 9h15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g></svg>` },
  };
  const PNG = new Set(["cocacola", "jnj", "pfizer", "moderna", "lockheed", "dell", "nebius", "tqqq"]);
  D.SOL_LIST = [
    ["FAVORITES"], ["xrp", "XRP", "$1.30", "-2.25%"], ["tsla", "TSLA", "$361.33", "-1.08%"], ["ethereum", "ETH", "$2,360.73", "-2.13%"],
    ["TRENDING"], ["mega", "MEGA", "$0.05", "+4.37%"], ["moderna", "MRNA", "$223.69", "+3.87%"], ["jnj", "JNJ", "$254.00", "+2.37%"],
    ["pyth", "PYTH", "$0.09", "+2.09%"], ["CRYPTO"], ["solana", "SOL", "$102.25", "-2.12%"],
  ];
  D.icon = function (key, cls) {
    if (PNG.has(key)) return `<div class="${cls}"><img src="assets/icons/${key}.png" alt=""></div>`;
    const g = LOGOS[key] || MINI[key];
    return `<div class="${cls}" style="background:${g.bg}">${LOGOS[key] ? LOGOS.art(key) : g.svg}</div>`;
  };

  // ---------------------------------------------------------------- markets page data
  const SOL = {
    price: "$102.25", chg: "-2.12%", up: false, name: "Solana", icon: "solana",
    stats: [["Bid", "$102.1856"], ["Ask", "$102.2879"], ["Spread", "$0.1022"], ["Volume", "$620.94M"], ["Trades", "2,036,781"], ["High", "$104.4677"], ["Low", "$101.5581"]],
    cat: "CRYPTO", sel: 0,
    rows: [["solana", "SOL", "$102.06", "-2.25%"], ["bitcoin", "BTC", "$80,820.62", "-0.86%"], ["zcash", "ZEC", "$1,088.13", "-4.24%"],
      ["hyperliquid", "HYPE", "$79.79", "-1.31%"], ["near", "NEAR", "$4.61", "-4.74%"], ["uni", "UNI", "$6.98", "-3.20%"],
      ["aave", "AAVE", "$149.38", "-2.60%"], ["lit", "LIT", "$2.98", "-3.95%"], ["bnb", "BNB", "$715.78", "-1.34%"]],
    shape: [[0, 100.4], [0.04, 102.6], [0.1, 106.6], [0.13, 107.7], [0.17, 106.5], [0.3, 106.6], [0.5, 107.0], [0.58, 107.3],
      [0.64, 106.6], [0.66, 104.3], [0.72, 103.7], [0.88, 103.9], [0.9, 101.6], [0.93, 102.9], [0.96, 103.6], [1, 102.06]],
    axis: [108, 104, 100], last: 102.25, seed: 7,
    acts: [["$101.82", "102.06", 0, "11:28:49"], ["$204.09", "102.06", 0, "11:28:48"], ["$246.96", "102.05", 1, "11:28:47"],
      ["$1,920.52", "102.05", 1, "11:28:47"], ["$299.93", "102.05", 1, "11:28:48"], ["$499.83", "102.06", 1, "11:28:48"]],
    sym: "SOL", news: `Solana declined <b>0.56%</b> over the past 24 hours to <b>$104.27.</b> The network has scheduled an upgrade called <b>Alpenglow</b> for late October that aims to…`,
    odds: [35, 50, 15],
  };
  const KO = {
    price: "$93.76", chg: "+3.09%", up: true, name: "Coca-Cola", icon: "cocacola",
    stats: [["Bid", "$93.7542"], ["Ask", "$93.7660"], ["Spread", "$0.0118"], ["Volume", "$1.28B"], ["Trades", "412,388"], ["High", "$94.0215"], ["Low", "$90.8130"]],
    cat: "STOCKS", sel: 0,
    rows: [["cocacola", "KO", "$93.76", "+3.09%"], ["jnj", "JNJ", "$253.09", "+1.86%"], ["pfizer", "PFE", "$29.17", "+2.73%"],
      ["moderna", "MRNA", "$218.28", "+2.43%"], ["lockheed", "LMT", "$516.41", "+2.01%"], ["dell", "DELL", "$142.37", "-0.84%"],
      ["nebius", "NBIS", "$96.12", "+1.12%"], ["tqqq", "TQQQ", "$98.55", "+2.41%"], ["treasury", "BIL", "$91.62", "+0.01%"]],
    shape: [[0, 90.9], [0.08, 91.2], [0.18, 91.0], [0.3, 91.6], [0.42, 91.4], [0.52, 92.1], [0.6, 92.0], [0.7, 92.7], [0.78, 92.5],
      [0.86, 93.2], [0.92, 93.1], [1, 93.76]],
    axis: [95, 93, 91], last: 93.76, seed: 11,
    acts: [["$375.00", "93.76", 1, "11:31:02"], ["$1,204.55", "93.76", 1, "11:31:01"], ["$88.10", "93.75", 0, "11:31:01"],
      ["$642.80", "93.75", 1, "11:31:00"], ["$219.37", "93.74", 1, "11:30:59"], ["$3,050.00", "93.74", 1, "11:30:58"]],
    sym: "KO", news: `Coca-Cola rose <b>3.09%</b> today to <b>$93.76</b> after raising its full-year outlook on steady volume growth and pricing.`,
    odds: [55, 35, 10],
  };

  function candles(cfg) {
    const sh = cfg.shape;
    const at = (u) => { let i = 0; while (u > sh[i + 1][0]) i++; const a = sh[i], b = sh[i + 1]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); };
    let s = cfg.seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const span = cfg.axis[0] - cfg.axis[2], N = 96, out = [];
    let prev = at(0);
    for (let i = 0; i < N; i++) {
      const u = (i + 1) / N, close = i === N - 1 ? cfg.last : at(u) + (rnd() - 0.5) * 0.11 * span;
      const open = prev, hi = Math.max(open, close) + rnd() * 0.055 * span, lo = Math.min(open, close) - rnd() * 0.055 * span;
      out.push({ open, close, hi, lo });
      prev = close;
    }
    return out;
  }
  const arrow = (up) => `<svg viewBox="0 0 12 12"><path d="${up ? "M6 10.5V2M2.5 5.5 6 2l3.5 3.5" : "M6 1.5V10M2.5 6.5 6 10l3.5-3.5"}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const STAT_X = [1104, 1241, 1351, 1482, 1610, 1746, 1883];
  // the layout editor's handle: a grip and an eye
  const HANDLE = `<svg class="grip" viewBox="0 0 12 18"><g fill="#8b8a86"><circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/><circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/></g></svg><svg class="eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="#6b6a66" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="#6b6a66" stroke-width="1.6"/></svg>`;

  // one Markets page; every block carries class "it" (the scene cascades them in) and the chart's candles sit in
  // .cnd (drawn left to right)
  function marketsPage(cfg, ko) {
    const py = (p) => 302 + (cfg.axis[0] - p) * (116 / (cfg.axis[0] - cfg.axis[2]));
    const cs = candles(cfg);
    const cHTML = cs.map((c, i) => {
      const up = c.close >= c.open, x = 360 + i * 9.9;
      const top = py(Math.max(c.open, c.close)), h = Math.max(1.5, Math.abs(py(c.open) - py(c.close)));
      return `<div class="wick ${up ? "g" : "r"}" style="left:${(x + 3.2).toFixed(1)}px;top:${py(c.hi).toFixed(1)}px;height:${(py(c.lo) - py(c.hi)).toFixed(1)}px"></div>` +
        `<div class="body ${up ? "g" : "r"}" style="left:${x.toFixed(1)}px;top:${top.toFixed(1)}px;height:${h.toFixed(1)}px"></div>`;
    }).join("");
    let ry = ko ? 339 : 300;
    const rows = (ko ? cfg.rows : D.SOL_LIST).map((r, i) => {
      if (r.length === 1) { const h = `<div class="lsec" style="top:${(ry + 30).toFixed(1)}px">${r[0]}</div>`; ry += 45; return h; }
      const h = `<div class="trow${ko && i === cfg.sel ? " on" : ""}" style="top:${ry.toFixed(1)}px">
        ${D.icon(r[0], "ic")}<span class="sym">${r[1]}</span><span class="pr">${r[2]}</span><span class="ch ${r[3][0] === "+" ? "up" : ""}">${r[3]}</span>
      </div>`;
      ry += 56.3; return h;
    }).join("");
    const stats = cfg.stats.map(([l, v], i) => `<div class="stat" style="right:${D.W - STAT_X[i]}px"><span>${l}</span><b>${v}</b></div>`).join("");
    const acts = cfg.acts.map(([a, p, up, t], i) => `
      <div class="arow" style="top:${(704 + i * 33).toFixed(0)}px"><span class="am">${a}</span>
        <span class="ap ${up ? "g" : "r"}">${arrow(up)}${p}</span><span class="at">${t}</span></div>`).join("");
    const [hi, st, lo] = cfg.odds;
    // the KO page's order panel has a live amount field and a Buy button; the Solana page shows it as captured
    const amt = ko
      ? `<div class="amt"><span class="l">Amount</span><span class="v ko-amt"><span class="ko-ph">0.00</span><span class="ko-typed"></span><span class="ko-caret"></span></span><span class="u">USD ⇄</span><span class="recv ko-recv">≈ 0.00 KO</span></div>`
      : `<div class="amt"><span class="l">Amount</span><span class="v">0.00</span><span class="u">USD ⇄</span></div>`;
    const lower = ko ? 430 : 374;
    return `
      <div class="panel head it" style="top:80px">
        <div class="px"><span class="big">${cfg.price}</span><span class="${cfg.up ? "pos" : "neg"}">${cfg.chg}</span><span class="pill">Indicative</span></div>
        <div class="nm"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="none" stroke="#555" stroke-width="1.5" stroke-linejoin="round"/></svg>
          ${D.icon(cfg.icon, "nic")}<span>${cfg.name}</span></div>
        ${stats}
        ${STAT_X.map((x) => `<div class="eh es" style="left:${x - 34}px;top:6px">${HANDLE}</div>`).join("")}
      </div>
      <div class="eh" style="left:30px;top:226px">${HANDLE}</div>
      <div class="panel list it">
        <div class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#666" stroke-width="1.8"/><path d="M15.5 15.5 20 20" stroke="#666" stroke-width="1.8" stroke-linecap="round"/></svg><span>Search or paste mint</span></div>
        <div class="lh"><span>Token</span><span style="left:172px">Price</span><span style="left:265px">24h</span></div>
        ${ko ? `<div class="cat">${cfg.cat}</div>` : ""}
      </div>
      <div class="rows it">${rows}</div>
      <div class="grp g-chart it">
      <div class="eh" style="left:372px;top:236px">${HANDLE}</div>
      <div class="panel chart"><div class="tf"><span>1m</span><span>5m</span><span>15m</span><span class="on">30m</span><span>1H</span><span>4H</span><span>1D</span></div></div>
      <div class="chartbits">
        <div class="plot"></div>
        <div class="grid" style="top:302px"></div><div class="grid" style="top:360px"></div><div class="grid" style="top:418px"></div>
        <div class="grid dot" style="top:${py(cfg.last).toFixed(1)}px"></div>
        <div class="cnd">${cHTML}</div>
        ${cfg.axis.map((v, i) => `<div class="ylab" style="top:${302 + i * 58}px">${v.toFixed(2)}</div>`).join("")}
        <div class="cur ${cfg.up ? "" : "dn"}" style="top:${(py(cfg.last) - 13.5).toFixed(1)}px">${cfg.last.toFixed(2)}</div>
        <div class="xlab" style="left:548px">12:00</div><div class="xlab b" style="left:764px">Oct 14</div>
        <div class="xlab" style="left:980px">12:00</div><div class="xlab b" style="left:1196px">Oct 15</div>
      </div>
      </div>
      <div class="grp g-act it">
      <div class="eh" style="left:372px;top:542px">${HANDLE}</div>
      <div class="panel act">
        <div class="atabs"><span class="on">Activity</span><span>Flow</span><span>Holders</span><span>Traders</span><span>Security</span><span>Orders</span></div>
        <svg class="flow" viewBox="0 0 1056 70" preserveAspectRatio="none">
          <path d="M0 64H120L140 56H330L350 40L520 36L640 30L660 14H880L900 6H1056V70H0Z" fill="rgba(79,140,104,.12)"/>
          <path d="M0 64H120L140 56H330L350 40L520 36L640 30L660 14H880L900 6H1056" fill="none" stroke="#4f8c68" stroke-width="2.2"/>
        </svg>
        <div class="th"><span>Amount (USD) ⇄</span><span class="thc">Price</span><span class="thr">Time</span></div>
      </div>
      <div class="acts">${acts}</div>
      </div>
      <div class="eh" style="left:1476px;top:226px">${HANDLE}</div>
      <div class="panel trade it">
        <div class="seg s1"><span class="buy">Buy</span><span>Sell</span></div>
        <div class="seg s2"><span class="on">Market</span><span>Limit</span></div>
        ${amt}
        <div class="pcts"><span>25%</span><span>50%</span><span>Max</span></div>
        ${ko ? `<div class="buybtn"><span class="bb-l0">Buy KO</span><span class="bb-l1"><svg class="bb-spin" viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 1-8 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>Buying…</span><span class="bb-l2"><svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.7 3.7L17.5 8.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Bought 4.00 KO</span></div>` : ""}
        <svg class="donut" style="top:${lower}px" viewBox="0 0 72 72"><circle cx="36" cy="36" r="31" fill="none" stroke="#e6e5e1" stroke-width="7"/>
          <circle cx="36" cy="36" r="31" fill="none" stroke="#4f8c68" stroke-width="7" pathLength="100" stroke-dasharray="${hi} ${100 - hi}" transform="rotate(-90 36 36)"/>
          <circle cx="36" cy="36" r="31" fill="none" stroke="#b0605a" stroke-width="7" pathLength="100" stroke-dasharray="${lo} ${100 - lo}" stroke-dashoffset="${lo}" transform="rotate(-90 36 36)"/>
          <text x="36" y="40.5" text-anchor="middle">${st}%</text></svg>
        <div class="leg" style="top:${lower - 2}px"><i style="background:#4f8c68"></i>Higher<b>${hi}%</b></div>
        <div class="leg" style="top:${lower + 25}px"><i style="background:#d4d3cf"></i>Steady<b>${st}%</b></div>
        <div class="leg" style="top:${lower + 51}px"><i style="background:#b0605a"></i>Lower<b>${lo}%</b></div>
        <div class="hn" style="top:${lower + 100}px">Happening now</div>
        <div class="news" style="top:${lower + 140}px;height:${ko ? 60 : 90}px">${cfg.news}</div>
        <div class="rm">Read more</div>${ko ? `<div class="askpill">Ask AI</div>` : ""}
      </div>`;
  }

  // ---------------------------------------------------------------- Ask AI side panel
  D.REPLY = "**SOL** is down **2.12%** today at **$102.25**, holding just above the **$100** support after a sharp drop overnight. Volume is up to **$620.94M** and most traders expect it to stay **steady**:";
  function spark(seed) {
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const pts = []; let y = 0.3;
    for (let i = 0; i < 48; i++) { const u = i / 47; y += (r() - 0.5) * 0.14 + (u > 0.7 && u < 0.8 ? 0.06 : 0.004); y = Math.max(0.08, Math.min(0.92, y)); pts.push([u * 140, y * 50]); }
    return pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  }
  function askPanel() {
    let bold = false;
    const words = D.REPLY.split(" ").map((tok) => {
      let html = "";
      tok.split("**").forEach((part, k) => { if (k > 0) bold = !bold; if (part) html += bold ? `<b>${part}</b>` : part; });
      return `<span class="rw">${html}</span>`;
    });
    const sol = D.icon("solana", "chip-ic");
    return `
      <div class="ap-title ap-it">What can I help with?</div>
      <div class="ap-sug ap-it" style="top:288px"><span>Analyze</span>${sol}</div>
      <div class="ap-sug ap-it" style="top:366px"><span>Buy</span>${sol}</div>
      <div class="ap-sug ap-it" style="top:444px"><span>What's moving</span></div>
      <div class="ap-bubble"><span>Analyze</span>${sol}</div>
      <div class="ap-typing"><i></i><i></i><i></i></div>
      <div class="ap-reply">${words.join(" ")}</div>
      <div class="ap-card">${D.icon("solana", "pic")}<div class="pnm">Solana</div><div class="psub">SOL · 30m</div>
        <div class="pamt">$102.25</div><div class="ppct">-2.12%</div>
        <svg class="pspark" viewBox="0 0 140 50"><path pathLength="1" d="${spark(4)}" fill="none" stroke="#b0605a" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>
        <div class="ap-odds"><span><i style="background:#4f8c68"></i>Higher 35%</span><span><i style="background:#d4d3cf"></i>Steady 50%</span><span><i style="background:#b0605a"></i>Lower 15%</span></div></div>
      <div class="ap-input"><span class="ph">Message</span><div class="send"><svg viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>`;
  }
  const ICON = {
    pencil: `<svg viewBox="0 0 24 24"><path d="M4 20l1-4.5L15.5 5a2 2 0 0 1 3 3L8 18.5z M13.5 7l3 3" fill="none" stroke="#444" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
    moon: `<svg viewBox="0 0 24 24"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" fill="none" stroke="#444" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    mute: `<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="none" stroke="#444" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" fill="none" stroke="#444" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="m5.5 12.5 4 4L18.5 7.5" fill="none" stroke="#2a2a2a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    revert: `<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 1 0 2.2-5.1M5 4.5V9h4.5" fill="none" stroke="#444" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  D.MENU = { x: 981, y: 62, w: 262 };
  const menuItem = (ic, label, y, cls) => `<div class="mi ${cls || ""}" style="top:${y}px">${ICON[ic]}<span>${label}</span></div>`;

  // ---------------------------------------------------------------- build
  D.build = function (host) {
    host.innerHTML = `
      <div class="desk">
        <div class="page p-sol">${marketsPage(SOL, false)}</div>
        <div class="page p-ko">${marketsPage(KO, true)}</div>
        <div class="nav">
          <svg class="mark" viewBox="0 0 40 40"><circle cx="18" cy="21" r="13" fill="none" stroke="#2a2a2c" stroke-width="5.5"/><rect x="29" y="5" width="5.5" height="31" rx="1.2" fill="#2a2a2c"/></svg>
          <div class="tabpill"></div>
          <span class="tab" data-k="markets" style="left:88px">Markets</span><span class="tab" style="left:211px">Portfolio</span>
          <span class="tab" style="left:340px"><i class="sp">✦</i>Launches</span><span class="tab" data-k="ai" style="left:508px">AI</span>
          <div class="gearbg"></div>
          <div class="rgrp">
            <svg class="gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" fill="none" stroke="#555" stroke-width="1.6"/><path d="M12 2.8l1.6 2.3 2.7-.8.6 2.8 2.7 1-.9 2.7 1.9 2-2 2 .9 2.7-2.7 1-.6 2.8-2.7-.8L12 21.2l-1.6-2.3-2.7.8-.6-2.8-2.7-1 .9-2.7-1.9-2 1.9-2-.9-2.7 2.7-1 .6-2.8 2.7.8z" fill="none" stroke="#555" stroke-width="1.5" stroke-linejoin="round"/></svg>
            <div class="bal solbal"><div class="bin">${D.icon("solana", "bic")}<span>$0.00</span></div></div>
            <div class="bal usdc">${D.icon("usdc", "bic round")}<span class="usdv">$0.00</span></div>
          </div>
          <div class="btn" style="left:1493px;width:112px">Deposit</div>
          <div class="btn" style="left:1618px;width:129px">Withdraw</div>
          <div class="btn dark account">Account</div>
          <div class="hint-edit">Drag to rearrange · chart up/down only · quote top/bottom/sides</div>
        </div>
        <div class="dropzone"><span>Drop here</span></div>
        <div class="gmenu gm0" style="left:${D.MENU.x}px;top:${D.MENU.y}px">${menuItem("pencil", "Edit layout", 10, "m-edit")}${menuItem("moon", "Dark mode", 64)}${menuItem("mute", "Mute", 118)}</div>
        <div class="gmenu gm1" style="left:${D.MENU.x}px;top:${D.MENU.y - 4}px">${menuItem("check", "Done editing", 6, "on m-done")}${menuItem("revert", "Revert layout", 60)}${menuItem("moon", "Dark mode", 114)}${menuItem("mute", "Mute", 168)}</div>
        <div class="askfloat">Ask AI</div>
        <div class="askpanel">${askPanel()}</div>
      </div>
      <div class="toast"><div class="t-ic">${D.icon("cocacola", "tic")}<div class="t-ok"><svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.7 3.7L17.5 8.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>
        <div class="t-txt"><span class="t-w"><b class="t-t0">Buying</b><b class="t-t1">Bought</b></span><span class="t-d">4.00 KO · $375.00</span></div>
        <svg class="t-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#4a4946" stroke-width="2.4"/><path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></div>`;
    const q = (s, r = host) => [...r.querySelectorAll(s)];
    const one = (s, r = host) => r.querySelector(s);
    const sol = one(".p-sol"), ai = one(".p-ai"), ko = one(".p-ko");
    const ap = one(".askpanel");
    return {
      desk: one(".desk"), nav: one(".nav"), tabpill: one(".tabpill"), solbal: one(".solbal"), usdv: one(".usdv"), gear: one(".gear"), gearbg: one(".gearbg"),
      sol, solItems: q(".it", sol), solCnd: one(".cnd", sol), gChart: one(".g-chart", sol), gAct: one(".g-act", sol),
      handles: q(".eh", sol), panels: q(".panel", sol), hint: one(".hint-edit"), drop: one(".dropzone"),
      gm0: one(".gm0"), gm1: one(".gm1"), miEdit: one(".m-edit"), miDone: one(".m-done"), mEditLabel: one(".m-edit span"),
      ko, koItems: q(".it", ko), koCnd: one(".cnd", ko), koPh: one(".ko-ph", ko), koTyped: one(".ko-typed", ko), koRecv: one(".ko-recv", ko),
      koAmtBox: one(".amt", ko), buy: one(".buybtn", ko), bb0: one(".bb-l0", ko), bb2: one(".bb-l2", ko), koHandles: q(".eh", ko),
      toast: one(".toast"), tOk: one(".t-ok"), tT0: one(".t-t0"), tT1: one(".t-t1"), tSpin: one(".t-spin"), tTxt: one(".t-txt"),
      askfloat: one(".askfloat"), ap, apItems: q(".ap-it", ap), apBubble: one(".ap-bubble", ap), apTyping: one(".ap-typing", ap),
      apDots: q(".ap-typing i", ap), apWords: q(".rw", ap), apCard: one(".ap-card", ap), apSpark: one(".pspark path", ap), apInput: one(".ap-input", ap),
      apSug: q(".ap-sug", ap),
    };
  };

  window.DESK = D;
})();
