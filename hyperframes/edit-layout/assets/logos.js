// Token art redrawn from the app screens: the same face is used for the card icon and the 3D coin.
(function () {
  const L = {};

  L.solana = {
    bg: "#1c1d21", rim: "#3a3c44", rimDark: "#121317",
    svg: `<svg viewBox="0 0 100 100"><defs><linearGradient id="solg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22e6a4"/><stop offset=".5" stop-color="#5a8cf0"/><stop offset="1" stop-color="#9d4bff"/></linearGradient></defs>
      <g fill="url(#solg)"><polygon points="33,29 79,29 68,40 22,40"/><polygon points="22,44.5 68,44.5 79,55.5 33,55.5"/><polygon points="33,60 79,60 68,71 22,71"/></g></svg>`,
  };

  L.bitcoin = {
    bg: "#ec9a3c", rim: "#f6c27e", rimDark: "#c97a22",
    svg: `<svg viewBox="0 0 100 100"><g transform="rotate(14 50 50)" fill="#fff">
      <rect x="41" y="17" width="6" height="12" rx="1"/><rect x="52" y="17" width="6" height="12" rx="1"/>
      <rect x="41" y="71" width="6" height="12" rx="1"/><rect x="52" y="71" width="6" height="12" rx="1"/>
      <path d="M33 27 H55 C66 27 71 32 71 39 C71 44 68 47 64 48.5 C69.5 50 73 54 73 60 C73 68 67 73 56 73 H33 V65 H38 V35 H33 Z M47 35 V46 H55 C59.5 46 62 44 62 40.5 C62 37 59.5 35 55 35 Z M47 53.5 V65 H56 C61 65 63.5 63 63.5 59.2 C63.5 55.5 61 53.5 56 53.5 Z"/></g></svg>`,
  };

  L.ethereum = {
    bg: "linear-gradient(160deg,#6066bd,#3e4398)", rim: "#8d91d6", rimDark: "#33377e",
    svg: `<svg viewBox="0 0 100 100">
      <polygon points="50,14 50,41 73,51" fill="#c9cbf3"/><polygon points="50,14 27,51 50,41" fill="#fff"/>
      <polygon points="50,41 73,51 50,64" fill="#a4a8e6"/><polygon points="50,41 27,51 50,64" fill="#e3e4fa"/>
      <polygon points="50,68 50,86 73,55" fill="#c9cbf3"/><polygon points="50,68 27,55 50,86" fill="#fff"/></svg>`,
  };

  L.zcash = {
    bg: "#e3b45a", rim: "#f3d595", rimDark: "#b98a33",
    svg: `<svg viewBox="0 0 100 100"><g fill="#1b1b1b">
      <rect x="45.5" y="17" width="9" height="11"/><rect x="45.5" y="72" width="9" height="11"/>
      <polygon points="29,27 71,27 71,38 45,62 71,62 71,73 29,73 29,62 55,38 29,38"/></g></svg>`,
  };

  L.hyperliquid = {
    bg: "#1a1b1f", rim: "#3a3c43", rimDark: "#0e0f12",
    svg: `<svg viewBox="0 0 100 100"><path fill="#abf9e3" d="M17 50 C17 31 33 29 41.5 39 C46 44.5 54 44.5 58.5 39 C67 29 83 31 83 50 C83 69 67 71 58.5 61 C54 55.5 46 55.5 41.5 61 C33 71 17 69 17 50 Z"/></svg>`,
  };

  L.near = {
    bg: "#69e99e", rim: "#a5f4c6", rimDark: "#3fbd74",
    svg: `<svg viewBox="0 0 100 100"><path d="M31 74 V27 L69 73 V26" fill="none" stroke="#111" stroke-width="9" stroke-linejoin="miter"/>
      <path d="M31 27 L46 27 L31 45 Z M69 73 L54 73 L69 55 Z" fill="#111"/></svg>`,
  };

  L.trump = {
    bg: "#eef0f6", rim: "#fff", rimDark: "#ccc",
    svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="27" fill="#3b6fd6"/><path d="M23 50 A27 27 0 0 1 50 23 V77 A27 27 0 0 1 23 50Z" fill="#e0453a"/>
      <circle cx="50" cy="48" r="14" fill="#f2d2b6"/><path d="M36 42 C38 30 62 30 64 42 C58 37 44 37 36 42Z" fill="#f4f4f4"/><rect x="40" y="62" width="20" height="14" rx="4" fill="#20304f"/></svg>`,
  };

  L.raydium = {
    bg: "#5fcf96", rim: "#9be6c0", rimDark: "#3aa972",
    svg: `<svg viewBox="0 0 100 100"><text x="50" y="58" text-anchor="middle" font-family="Inter" font-size="20" font-weight="500" fill="#fff">R</text></svg>`,
  };

  // gradient ids must be unique per instance: a def inside a hidden subtree does not paint elsewhere
  let uid = 0;
  L.art = (key) => L[key].svg.replace(/id="(\w+)"/g, (m, id) => `id="${id}-${++uid}"`).replace(/url\(#(\w+)\)/g, (m, id) => `url(#${id}-${uid})`);

  window.LOGOS = L;
})();
