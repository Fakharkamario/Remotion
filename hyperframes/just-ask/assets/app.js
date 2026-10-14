// Home, AI and trade screens from the supplied screenshots, rebuilt in DOM at iPhone point size (430 x 932 pt).
// Positions are measured off the 1290 px wide screenshots (px / 3 = pt). Logos are cropped from them.
// Mock data for the video: $1,350.00 in the account, rules "Keep $100 USDC / Max $500 a trade", and an
// AI reply that splits the other $1,250 into three low-risk assets.
(function () {
  const A = {};
  A.W = 430;
  A.H = 932;
  A.BALANCE = 1350;

  A.status = (time, batt, id) => `
    <svg class="status" viewBox="0 0 430 54" width="430" height="54">
      <text x="52.2" y="36.2" class="sb-time">${time}</text>
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
        <defs><clipPath id="${id}"><rect width="28.3" height="14.9" rx="4.4"/></clipPath></defs>
        <g clip-path="url(#${id})"><rect width="28.3" height="14.9" fill="#b3b2ae"/><rect width="${(28.3 * batt) / 100}" height="14.9" fill="#111"/></g>
        <path d="M29.3 5.1c1 .3 1.6 1.2 1.6 2.35s-.6 2.05-1.6 2.35z" fill="#b3b2ae"/>
        <text x="14.15" y="11.35" class="sb-batt">${batt}</text>
      </g>
    </svg>`;

  // seeded noise for sparklines; every Home row in the screenshot trends up into the close
  function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
  function spark(seed, jag, w = 72, h = 30) {
    const r = rng(seed), n = 56, pts = [];
    let y = 0.62;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      y += (r() - 0.5) * jag - 0.006 * Math.pow(u, 3) * 9;
      if (u > 0.78) y -= (r() * 0.09) * (seed % 2 ? 1 : 0.6);
      y = Math.max(0.05, Math.min(0.95, y));
      pts.push([u * w, y * h]);
    }
    return pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
  }
  A.spark = spark;

  A.ROWS = [
    { icon: "pons_h", name: "Pons", sym: "PONS", px: "$0.34464", pct: "+4.15%", seed: 5, jag: 0.34 },
    { icon: "cocacola", name: "Coca-Cola", sym: "KO", px: "$93.7601", pct: "+3.09%", seed: 8, jag: 0.12 },
    { icon: "pfizer_h", name: "Pfizer", sym: "PFE", px: "$29.168", pct: "+2.73%", seed: 13, jag: 0.1 },
    { icon: "moderna_h", name: "Moderna", sym: "MRNA", px: "$218.2797", pct: "+2.43%", seed: 21, jag: 0.26 },
    { icon: "lockheed_h", name: "Lockheed", sym: "LMT", px: "$516.4091", pct: "+2.01%", seed: 3, jag: 0.12 },
    { icon: "jnj", name: "Johnson & Johnson", sym: "JNJ", px: "$253.0916", pct: "+1.86%", seed: 34, jag: 0.16 },
  ];
  A.ROW0 = 375; A.ROW_PITCH = 64;

  // the AI's mock plan: $100 kept aside, $1,250 split (none above the $500-a-trade rule)
  A.PLAN = [
    { icon: "treasury", name: "US Treasury Bills", sub: "Treasuries · 3-month", amt: 500, pct: 40 },
    { icon: "jnj", name: "Johnson & Johnson", sub: "JNJ · $253.09", amt: 375, pct: 30 },
    { icon: "cocacola", name: "Coca-Cola", sub: "KO · $93.76", amt: 375, pct: 30 },
  ];
  A.CARD_TOP = 244; A.CARD_PITCH = 84; A.CARD_H = 74;
  A.REPLY = [
    ["You", 0], ["have", 0], ["$1,350.00", 1], ["USDC.", 1], ["Keeping", 0], ["$100", 0], ["aside", 0], ["per", 0], ["your", 0], ["rules,", 0],
    ["here's", 0], ["a", 0], ["low-risk", 0], ["split", 0], ["for", 0], ["the", 0], ["other", 0], ["$1,250:", 0],
  ];
  A.PROMPT = "Put my cash into low-risk assets";
  A.TRADE = { amt: 375, price: 93.7601, digits: "375" };

  const icon = (k) => k === "treasury"
    ? `<div class="ticon tre"><svg viewBox="0 0 24 24"><path d="M3.5 9 12 4.5 20.5 9z M5.5 11v7 M9.5 11v7 M14.5 11v7 M18.5 11v7 M3.5 20.5h17 M4.5 9h15" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
    : `<img class="ticon" src="assets/icons/${k}.png" alt="">`;
  const TAB = {
    home: `<path d="M4 10.2 12 4l8 6.2V20H14.5v-5.5h-5V20H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>`,
    explore: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>`,
    ai: `<path d="M10 5.5 11.7 10.3 16.5 12 11.7 13.7 10 18.5 8.3 13.7 3.5 12 8.3 10.3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M18 3v4M16 5h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="5" cy="19.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
    tx: `<path d="M5 3.5h14v17l-2.3-1.4-2.4 1.4-2.3-1.4-2.3 1.4-2.4-1.4L5 20.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.4 8.6c-.4-.8-1.3-1.2-2.4-1.2-1.4 0-2.4.7-2.4 1.8 0 2.4 5 1.3 5 3.8 0 1.1-1.1 1.9-2.6 1.9-1.2 0-2.2-.5-2.6-1.4M12 6v1.4M12 14.3v1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  };
  const KEYS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const arrowUp = `<svg viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const search = `<div class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7" fill="none" stroke="#666" stroke-width="1.9"/><path d="M15.8 15.8 21 21" stroke="#666" stroke-width="1.9" stroke-linecap="round"/></svg><span>Search</span></div>`;

  A.build = function (host) {
    const rows = A.ROWS.map((r, i) => `
      <div class="hrow h-it" style="top:${A.ROW0 + i * A.ROW_PITCH}px">
        <img class="hic" src="assets/icons/${r.icon}.png" alt="">
        <div class="hnm">${r.name}</div><div class="hsym">${r.sym}</div>
        <svg class="hspark" viewBox="0 0 72 30"><path pathLength="1" d="${spark(r.seed, r.jag)}" fill="none" stroke="#4f8c68" stroke-width="1.35" stroke-linejoin="round" stroke-linecap="round"/></svg>
        <div class="hpx">${r.px}</div><div class="hpc">${r.pct}</div>
      </div>`).join("");
    const plan = A.PLAN.map((p, i) => `
      <div class="pcard c-it" style="top:${A.CARD_TOP + i * A.CARD_PITCH}px">
        ${icon(p.icon)}
        <div class="pnm">${p.name}</div><div class="psub">${p.sub}</div>
        <div class="pamt" data-v="${p.amt}">$${p.amt.toFixed(2)}</div><div class="ppct">${p.pct}% of plan</div>
        <div class="pbar"><div class="pfill" style="width:${p.pct}%"></div></div>
      </div>`).join("");
    const reply = A.REPLY.map(([w, b]) => `<span class="rw${b ? " b" : ""}">${w}</span>`).join(" ");
    const keyRow = (s, cls) => `<div class="krow ${cls || ""}">${[...s].map((c) => `<div class="key" data-k="${c}">${c}</div>`).join("")}</div>`;

    host.innerHTML = `
      <div class="phone"></div>
      <div class="screen">
        <div class="explore-host"></div>

        <div class="home">
          ${A.status("8:45", 84, "sb-h")}
          <img class="h-it logo" src="assets/icons/acend.png" alt="acend">
          <div class="h-it avatarM"><span>M</span></div>
          <div class="h-it h-total">Total assets <svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="#6b6b69" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="#6b6b69" stroke-width="1.6"/></svg></div>
          <div class="h-it h-bal">$0.00</div>
          <div class="h-it h-add">Add Funds</div>
          <div class="h-it h-search">${search}</div>
          <div class="h-it h-tabs"><span class="on">Hot</span><span>Favourites</span><span>Holdings</span></div>
          ${rows}
          <div class="h-it h-div"></div>
        </div>

        <div class="ai">
          ${A.status("8:45", 84, "sb-a")}
          <svg class="a-edit" viewBox="0 0 24 24"><path d="M13.5 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-7.5" fill="none" stroke="#555" stroke-width="1.6" stroke-linecap="round"/><path d="M17.6 3.6a1.9 1.9 0 0 1 2.7 2.7L12 14.6l-3.6.9.9-3.6z" fill="none" stroke="#555" stroke-width="1.6" stroke-linejoin="round"/></svg>
          <div class="a-it a-title">What can I help with?</div>
          <div class="a-it a-sug" style="top:338px"><span>Analyze</span><img src="assets/icons/cluster_analyze.png" alt=""></div>
          <div class="a-it a-sug" style="top:390px"><span>Buy</span><img src="assets/icons/cluster_buy.png" alt=""></div>
          <div class="a-it a-sug" style="top:442px"><span>What's moving</span></div>

          <div class="bubble"><span>${A.PROMPT}</span></div>
          <div class="typing"><i></i><i></i><i></i></div>
          <div class="reply">${reply}</div>
          ${plan}
          <div class="c-it hint">Tap an asset to review the trade.</div>

          <div class="dock">
            <div class="chips"><span class="chip">Keep $100 USDC</span><span class="chip">Max $500 a trade</span><span class="clear">Clear rules</span></div>
            <div class="input"><span class="ph">Message</span><span class="typed"></span><span class="caret"></span>
              <div class="send">${arrowUp}</div></div>
          </div>
        </div>

        <div class="tabbar">
          ${[["home", "Home"], ["explore", "Explore"], ["ai", "AI"], ["tx", "Transactions"]].map(([k, l]) => `<div class="tab" data-k="${k}"><svg viewBox="0 0 24 24">${TAB[k]}</svg><span>${l}</span></div>`).join("")}
        </div>

        <div class="kbd">
          ${keyRow(KEYS[0])}${keyRow(KEYS[1], "mid")}
          <div class="krow"><div class="key fn">⇧</div>${[...KEYS[2]].map((c) => `<div class="key" data-k="${c}">${c}</div>`).join("")}<div class="key fn">⌫</div></div>
          <div class="krow last"><div class="key fn n123">123</div><div class="key space" data-k=" ">space</div><div class="key go">send</div></div>
          <div class="kfoot"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#555" stroke-width="1.6"/><circle cx="9" cy="10" r="1.2" fill="#555"/><circle cx="15" cy="10" r="1.2" fill="#555"/><path d="M8 14.5c2.2 2.5 5.8 2.5 8 0" fill="none" stroke="#555" stroke-width="1.6" stroke-linecap="round"/></svg>
            <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="#555" stroke-width="1.6"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="#555" stroke-width="1.6" stroke-linecap="round"/></svg></div>
        </div>

        <div class="backdrop"></div>
        <!-- trade panel (from the supplied Coca-Cola screenshots): full-screen, slides up over the chat -->
        <div class="trade">
          ${A.status("8:45", 84, "sb-t")}
          <svg class="t-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="#555" stroke-width="1.7" stroke-linecap="round"/></svg>
          <img class="t-ic" src="assets/icons/cocacola.png" alt="">
          <div class="t-name">Coca-Cola</div>
          <div class="t-px">$93.7601</div><div class="t-pc">▲ 3.09%</div>
          <div class="t-amt"></div>
          <div class="t-recv">Receive ~0.00 ko</div>
          ${["10%", "25%", "50%", "Max"].map((l, i) => `<div class="t-pill" style="left:${[20, 119.8, 219.2, 319][i]}px">${l}</div>`).join("")}
          ${["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((k, i) => {
            const x = [84.3, 214.6, 344.4][i % 3], y = [506, 569.9, 633.8, 697.6][Math.floor(i / 3)];
            return k === "del"
              ? `<div class="t-key t-del" style="left:${x - 21.8}px;top:${y - 21.3}px"><svg viewBox="0 0 24 24"><path d="M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9l-6-7z" fill="none" stroke="#222" stroke-width="1.9" stroke-linejoin="round"/><path d="m11.5 9.5 5 5m0-5-5 5" stroke="#222" stroke-width="1.9" stroke-linecap="round"/></svg></div>`
              : `<div class="t-key" data-d="${k}" style="left:${x - 30}px;top:${y - 30}px"><i></i><span>${k}</span></div>`;
          }).join("")}
          <div class="t-avail">$1,350.00 available <span>+</span></div><div class="t-fee">0.5% fee</div>
          <div class="t-btn">
            <div class="t-fill"></div>
            <span class="t-lbl0">Enter an amount</span><span class="t-lbl1">Slide to buy</span>
            <div class="t-knob"><svg class="t-chev" viewBox="0 0 24 24"><path d="m6.5 7 5 5-5 5M12.5 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg class="t-spin" viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 1-8 8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
              <svg class="t-check" viewBox="0 0 24 24"><path d="m6.5 12.5 3.7 3.7L17.5 8.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
          <div class="t-island">
            <div class="i-ic"><img src="assets/icons/cocacola.png" alt=""><div class="i-ok"><svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.7 3.7L17.5 8.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>
            <div class="i-txt"><b class="i-t0">Buying</b><b class="i-t1">Bought</b><span>4.00 KO · $375.00</span></div>
            <svg class="i-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#3b3a37" stroke-width="2.4"/><path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>
          </div>
        </div>
        <div class="home-ind"></div>
      </div>`;

    const q = (s) => [...host.querySelectorAll(s)];
    const one = (s) => host.querySelector(s);
    const keys = {};
    q(".key[data-k]").forEach((k) => (keys[k.dataset.k] = k));
    return {
      screen: one(".screen"), explore: one(".explore-host"),
      home: one(".home"), homeItems: q(".h-it"), bal: one(".h-bal"), sparks: q(".hspark path"), avatarM: one(".avatarM"),
      ai: one(".ai"), aiItems: q(".a-it"), dock: one(".dock"), input: one(".input"), ph: one(".ph"), typed: one(".typed"),
      caret: one(".caret"), send: one(".send"), bubble: one(".bubble"), typing: one(".typing"), dots: q(".typing i"),
      words: q(".rw"), cards: q(".c-it"), amts: q(".pamt"), fills: q(".pfill"),
      tabs: q(".tab"), kbd: one(".kbd"), keys,
      backdrop: one(".backdrop"), trade: one(".trade"), tItems: q(".trade > :not(.t-island):not(.status)"),
      tAmt: one(".t-amt"), tRecv: one(".t-recv"), tKeys: Object.fromEntries(q(".t-key[data-d]").map((k) => [k.dataset.d, k])),
      tFee: one(".t-fee"), tBtn: one(".t-btn"), tFill: one(".t-fill"), tKnob: one(".t-knob"), tChev: one(".t-chev"), tSpin: one(".t-spin"), tCheck: one(".t-check"),
      tLbl0: one(".t-lbl0"), tLbl1: one(".t-lbl1"), island: one(".t-island"), iOk: one(".i-ok"), iT0: one(".i-t0"), iT1: one(".i-t1"),
      iSpin: one(".i-spin"), iTxt: one(".i-txt"), iIc: one(".i-ic"),
    };
  };

  window.APP = A;
})();
