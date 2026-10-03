// Generates the static SVG artwork used by the HyperFrames compositions.
// Ported from the Remotion project's src/components/Plant.tsx and Room.tsx so
// both versions of the Plantea promo share the same original illustrations.
// Run: node scripts/gen-art.mjs
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'art');
mkdirSync(OUT, {recursive: true});

// ---------- colour helpers ----------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const ramp = (t, stops, colors) => {
	for (let i = 0; i < stops.length - 1; i++) {
		if (t <= stops[i + 1]) return mix(colors[i], colors[i + 1], (t - stops[i]) / (stops[i + 1] - stops[i]));
	}
	return colors[colors.length - 1];
};

// ---------- plant (800 x 900 viewBox, pot at bottom centre) ----------
const LEAVES = [
	{angle: -58, stalk: 150, length: 210, width: 46, curl: -22, tears: 2, tone: 0.8},
	{angle: -40, stalk: 230, length: 230, width: 50, curl: -18, tears: 3, tone: 0.3},
	{angle: -24, stalk: 300, length: 240, width: 54, curl: -10, tears: 1, tone: 0.6},
	{angle: -10, stalk: 340, length: 230, width: 52, curl: -6, tears: 2, tone: 0.1},
	{angle: 4, stalk: 360, length: 220, width: 50, curl: 8, tears: 0, tone: 0.5},
	{angle: 18, stalk: 320, length: 240, width: 54, curl: 14, tears: 3, tone: 0.9},
	{angle: 33, stalk: 260, length: 230, width: 50, curl: 20, tears: 1, tone: 0.2},
	{angle: 50, stalk: 190, length: 220, width: 48, curl: 26, tears: 2, tone: 0.7},
	{angle: 66, stalk: 120, length: 190, width: 44, curl: 30, tears: 1, tone: 0.4},
	{angle: -72, stalk: 90, length: 170, width: 40, curl: -34, tears: 1, tone: 0.95},
];
const DEG = Math.PI / 180;
const blade = (l, rawW) => {
	const w = rawW * 1.35;
	return `M0,0 C${l * 0.18},${-w * 1.05} ${l * 0.7},${-w * 1.1} ${l},0 C${l * 0.7},${w * 0.95} ${l * 0.18},${w} 0,0 Z`;
};
const POT = 'M318,630 L482,630 L466,800 Q400,814 334,800 Z';

/** Inner plant markup. variant: natural | scan. health 0 = dying, 1 = healthy. */
function plantBody({health = 0, variant = 'natural', glow = 0, id = 'p', pot = true}) {
	const scan = variant === 'scan';
	const leafFill = (t) => mix(ramp(t, [0, 0.5, 1], ['#E2C14A', '#D7A936', '#B9852F']), mix('#4E9A45', '#2F6E31', t), health);
	const edgeFill = (t) => mix(mix('#9C6A2A', '#7A4520', t), mix('#2E6A2C', '#1F4F22', t), health);
	const stalk = mix('#A27A3A', '#4C7A3A', health);
	const bx = 400;
	const by = 640;
	let s = `<defs>
<filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="${id}-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.6" fill="#7BE36A"/></pattern>
<linearGradient id="${id}-pot" x1="0" x2="1"><stop offset="0" stop-color="#2A1E26"/><stop offset="0.45" stop-color="#4A3542"/><stop offset="1" stop-color="#21171E"/></linearGradient>
</defs>`;
	s += `<g${glow > 0 || scan ? ` filter="url(#${id}-glow)"` : ''}>`;
	LEAVES.forEach((leaf, i) => {
		const a = leaf.angle * DEG;
		const bend = leaf.curl * DEG;
		const midA = a + bend * 0.4;
		const endA = a + bend;
		const mx = bx + Math.sin(midA) * leaf.stalk * 0.5;
		const my = by - Math.cos(midA) * leaf.stalk * 0.5;
		const ex = bx + Math.sin(endA) * leaf.stalk;
		const ey = by - Math.cos(endA) * leaf.stalk;
		const rot = endA / DEG - 90 + leaf.curl * 0.6;
		const b = blade(leaf.length, leaf.width);
		s += `<path d="M${bx + (i - 5) * 3},${by} Q${mx},${my} ${ex},${ey}" stroke="${scan ? '#8BEA7B' : stalk}" stroke-width="${scan ? 4 : 7}" fill="none" stroke-linecap="round"/>`;
		s += `<g transform="translate(${ex},${ey}) rotate(${rot})">`;
		if (scan) {
			s += `<path d="${b}" fill="#A6F08F" opacity="0.35"/><path d="${b}" fill="url(#${id}-dots)"/><path d="${b}" fill="none" stroke="#6EDB5C" stroke-width="2.5"/>`;
		} else {
			s += `<path d="${b}" fill="${edgeFill(leaf.tone)}"/>`;
			s += `<path d="${blade(leaf.length * 0.96, leaf.width * 0.8)}" transform="translate(${leaf.length * 0.02},0)" fill="${leafFill(leaf.tone)}"/>`;
			if (glow > 0) s += `<path d="${b}" fill="#FFF27A" opacity="${glow * 0.55}"/>`;
		}
		s += `<line x1="0" y1="0" x2="${leaf.length * 0.97}" y2="0" stroke="${scan ? '#D9FFD0' : mix('#F3DE8A', '#9CCB7E', health)}" stroke-width="2.5" opacity="0.8"/>`;
		for (let t = 0; t < leaf.tears; t++) {
			const x = leaf.length * (0.3 + t * 0.2);
			const side = t % 2 === 0 ? -1 : 1;
			s += `<line x1="${x}" y1="${side * 4}" x2="${x + 14}" y2="${side * leaf.width * 0.85}" stroke="${scan ? '#6EDB5C' : '#F3F2EC'}" stroke-opacity="${scan ? 0.8 : 0.5}" stroke-width="2"/>`;
		}
		s += '</g>';
	});
	s += '</g>';
	if (pot) {
		s += scan
			? `<g filter="url(#${id}-glow)"><path d="${POT}" fill="#9CEB84" opacity="0.5"/><path d="${POT}" fill="url(#${id}-dots)"/><path d="${POT}" fill="none" stroke="#6EDB5C" stroke-width="3"/></g>`
			: `<ellipse cx="400" cy="806" rx="92" ry="12" fill="#000" opacity="0.18"/><path d="${POT}" fill="url(#${id}-pot)"/><rect x="312" y="622" width="176" height="18" rx="6" fill="#3B2B36"/>`;
	}
	return s;
}
const plantSvg = (opts) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -40 920 900" width="920" height="900" overflow="visible">${plantBody(opts)}</svg>`;

// ---------- room furniture (1920 x 1080) ----------
function art(x, y, w, h, kind) {
	const pad = w * 0.1;
	const ix = x + pad, iy = y + pad, iw = w - pad * 2, ih = h - pad * 2;
	const dark = '#24432C', mid = '#5E8466';
	let s = `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="#1D1B18" rx="2"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#EAE6D8"/><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="#D9DCC9"/>`;
	if (kind === 0) {
		s += `<rect x="${ix}" y="${iy}" width="${iw * 0.45}" height="${ih}" fill="${dark}"/><circle cx="${ix + iw * 0.45}" cy="${iy + ih * 0.5}" r="${iw * 0.3}" fill="${mid}"/><rect x="${ix + iw * 0.65}" y="${iy + ih * 0.6}" width="${iw * 0.35}" height="${ih * 0.4}" fill="${dark}"/>`;
	} else if (kind === 1) {
		s += `<path d="M${ix},${iy + ih} L${ix},${iy + ih * 0.45} A${iw * 0.5},${iw * 0.5} 0 0 1 ${ix + iw},${iy + ih * 0.45} L${ix + iw},${iy + ih} Z" fill="${dark}"/><rect x="${ix + iw * 0.3}" y="${iy + ih * 0.55}" width="${iw * 0.4}" height="${ih * 0.45}" fill="${mid}"/>`;
	} else if (kind === 2) {
		s += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih * 0.5}" fill="${mid}"/><rect x="${ix + iw * 0.2}" y="${iy + ih * 0.25}" width="${iw * 0.6}" height="${ih * 0.5}" fill="${dark}"/>`;
	} else {
		for (let i = 0; i < 3; i++) {
			const x0 = ix + iw * (0.15 + i * 0.25), x1 = ix + iw * (0.35 + i * 0.25);
			s += `<path d="M${x0},${iy + ih} L${x0},${iy + ih * 0.4} A${iw * 0.1},${iw * 0.1} 0 0 1 ${x1},${iy + ih * 0.4} L${x1},${iy + ih}" fill="none" stroke="${i === 1 ? mid : dark}" stroke-width="${iw * 0.07}"/>`;
		}
	}
	return s;
}
const smallPlant = (x, y, sc) =>
	`<g transform="translate(${x},${y}) scale(${sc})">${[-50, -25, 0, 25, 50]
		.map((a, i) => `<ellipse cx="0" cy="-38" rx="11" ry="34" fill="${i % 2 ? '#3E7A3A' : '#2D5E2C'}" transform="rotate(${a})"/>`)
		.join('')}<path d="M-22,0 L22,0 L17,34 L-17,34 Z" fill="#C9B79A"/></g>`;
const snakePlant = (x, y, sc) =>
	`<g transform="translate(${x},${y}) scale(${sc})">${[-18, -9, -3, 4, 11, 19, -12, 14]
		.map((a, i) => {
			const bx = (i - 4) * 9;
			return `<path d="M${bx},0 Q${bx - 14},-150 ${bx + Math.sin(a) * 30},-${230 + (i % 3) * 50} Q${bx + 18},-140 ${bx + 14},0 Z" fill="${i % 2 ? '#3F7334' : '#2A5527'}" stroke="#B8C76A" stroke-width="2" transform="rotate(${a * 0.6})"/>`;
		})
		.join('')}<path d="M-80,0 L80,0 L70,150 Q0,162 -70,150 Z" fill="#6A3A2C"/><rect x="-86" y="-8" width="172" height="14" rx="5" fill="#7A4532"/></g>`;
const sideboard = (x, y, w) => {
	let s = `<rect x="${x}" y="${y}" width="${w}" height="150" rx="6" fill="#8A4A22"/><rect x="${x}" y="${y}" width="${w}" height="14" rx="4" fill="#9C5A2C"/>`;
	for (let i = 0; i < 3; i++) s += `<rect x="${x + 16 + i * ((w - 32) / 3)}" y="${y + 26}" width="${(w - 32) / 3 - 10}" height="110" rx="3" fill="${i === 1 ? '#7A3F1C' : '#93522A'}" stroke="#6C3616" stroke-width="2"/>`;
	return s + `<rect x="${x + 20}" y="${y + 150}" width="10" height="60" fill="#5A2D12"/><rect x="${x + w - 30}" y="${y + 150}" width="10" height="60" fill="#5A2D12"/>`;
};
const armchair = (x, y, sc = 1) => {
	let s = `<g transform="translate(${x},${y}) scale(${sc})"><path d="M0,0 L40,-170 L64,-170 L30,10 Z" fill="#8E4E24"/><rect x="10" y="-20" width="230" height="40" rx="10" fill="#A86A3A"/><path d="M38,-160 L210,-150 L228,-24 L22,-24 Z" fill="#C79A5E" opacity="0.9"/>`;
	for (let i = 0; i < 6; i++) s += `<line x1="${44 + i * 30}" y1="-150" x2="${36 + i * 32}" y2="-26" stroke="#A9773E" stroke-width="4"/>`;
	return s + `<path d="M20,20 L0,120 M230,20 L250,120 M70,20 L60,110 M190,20 L200,110" stroke="#7A3F1C" stroke-width="10" stroke-linecap="round"/></g>`;
};
const sofa = (x, y) =>
	`<rect x="${x}" y="${y - 120}" width="560" height="160" rx="70" fill="#E7E1D6"/><rect x="${x + 30}" y="${y - 30}" width="540" height="140" rx="60" fill="#F1ECE3"/><rect x="${x + 60}" y="${y - 150}" width="130" height="110" rx="30" fill="#2E4A33" transform="rotate(-8 ${x + 120} ${y - 100})"/><rect x="${x + 200}" y="${y - 150}" width="130" height="110" rx="30" fill="#3D5C41" transform="rotate(6 ${x + 260} ${y - 100})"/>`;
const bed = (x, y) =>
	`<rect x="${x}" y="${y - 260}" width="620" height="200" rx="10" fill="#8A4A22"/><rect x="${x + 20}" y="${y - 90}" width="580" height="110" rx="14" fill="#F2EEE6"/><rect x="${x + 60}" y="${y - 150}" width="200" height="80" rx="26" fill="#E6E0D3"/><rect x="${x + 330}" y="${y - 150}" width="200" height="80" rx="26" fill="#E6E0D3"/><path d="M${x + 10},${y - 60} L${x + 610},${y - 60} L${x + 640},${y + 120} L${x - 20},${y + 120} Z" fill="#2F4F35"/><path d="M${x + 10},${y - 60} L${x + 610},${y - 60} L${x + 612},${y - 30} L${x + 8},${y - 30} Z" fill="#3D6444"/>`;
const lamp = (x, y) =>
	`<path d="M${x - 46},${y - 90} Q${x},${y - 150} ${x + 46},${y - 90} Z" fill="#9CC2A6"/><rect x="${x - 5}" y="${y - 92}" width="10" height="80" fill="#7FA48A"/><ellipse cx="${x}" cy="${y - 10}" rx="34" ry="10" fill="#7FA48A"/>`;

// Plant placement inside each room (top-left of the 800x900 plant box).
export const PLANT_POS = {living: [560, 40], bedroom: [640, 80], corner: [560, 60]};

function roomSvg({variant, plant = null, id = 'r'}) {
	const floorY = 820;
	let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080"><defs>
<linearGradient id="${id}-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9C6A9"/><stop offset="0.6" stop-color="#B4B595"/><stop offset="1" stop-color="#8F9177"/></linearGradient>
<linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E3A22"/><stop offset="1" stop-color="#4B2414"/></linearGradient>
<linearGradient id="${id}-sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7AE" stop-opacity="0.75"/><stop offset="1" stop-color="#FFD58A" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}-vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
</defs>`;
	s += `<rect width="1920" height="${floorY}" fill="url(#${id}-wall)"/><rect y="${floorY}" width="1920" height="${1080 - floorY}" fill="url(#${id}-floor)"/>`;
	for (let i = 0; i < 16; i++) s += `<line x1="${i * 140 - 200}" y1="${floorY}" x2="${i * 180 - 500}" y2="1080" stroke="#3E1D10" stroke-opacity="0.35" stroke-width="2"/>`;
	s += `<rect y="${floorY - 14}" width="1920" height="14" fill="#E3DCCB"/><rect width="1920" height="40" fill="#5E3C2A"/><path d="M260,0 L420,0 L380,60 L300,60 Z" fill="#6E4630"/><path d="M1480,0 L1640,0 L1600,60 L1520,60 Z" fill="#6E4630"/>`;
	s += `<path d="M0,120 L760,120 L1340,820 L380,820 Z" fill="url(#${id}-sun)"/><path d="M1100,80 L1500,80 L1900,700 L1500,700 Z" fill="url(#${id}-sun)" opacity="0.6"/>`;
	if (variant === 'living') {
		s += art(300, 230, 170, 250, 0) + art(510, 200, 130, 150, 2) + art(510, 380, 130, 130, 1) + art(1230, 240, 190, 230, 1) + art(1460, 260, 140, 200, 3);
		s += sideboard(300, 560, 560) + smallPlant(350, 560, 1);
		s += `<rect x="600" y="540" width="26" height="20" rx="4" fill="#4E6B4E"/><path d="M680,560 Q690,500 700,560 Z" fill="#3E5E44"/><path d="M720,560 Q735,480 750,560 Z" fill="#5C7C5C"/>`;
		s += armchair(170, 830, 1.1) + `<rect x="1110" y="620" width="120" height="200" rx="4" fill="#7A3F1C"/>`;
		['#E1D6B8', '#5E7B5E', '#B98C55', '#D7CFC0', '#40593F'].forEach((c, i) => (s += `<rect x="${1122 + i * 18}" y="720" width="14" height="86" fill="${c}"/>`));
		s += lamp(1170, 620) + sofa(1340, 960);
	} else if (variant === 'bedroom') {
		s += art(200, 240, 170, 240, 2) + art(400, 220, 130, 170, 0) + art(1250, 200, 160, 210, 3) + art(1440, 230, 140, 160, 1);
		s += sideboard(140, 600, 420) + smallPlant(200, 600, 0.9) + armchair(560, 860, 1);
		s += `<rect x="1040" y="660" width="130" height="160" rx="6" fill="#8A4A22"/>` + lamp(1105, 660) + bed(1180, 860);
	} else {
		s += `<rect x="60" y="120" width="360" height="640" fill="#EAF0EE"/><rect x="60" y="120" width="360" height="640" fill="none" stroke="#8A6A4A" stroke-width="16"/><line x1="240" y1="120" x2="240" y2="760" stroke="#8A6A4A" stroke-width="10"/>`;
		s += art(1250, 180, 230, 300, 0) + art(1520, 220, 150, 200, 3) + snakePlant(1180, 780, 1.1) + armchair(1500, 850, 1.1) + smallPlant(560, 820, 1.6);
	}
	if (plant) {
		const [px, py] = PLANT_POS[variant];
		s += `<svg x="${px}" y="${py}" width="800" height="900" viewBox="0 0 800 900" overflow="visible">${plantBody({...plant, id: `${id}-pl`})}</svg>`;
	}
	s += `<rect width="1920" height="1080" fill="url(#${id}-vig)" pointer-events="none"/></svg>`;
	return s;
}

const files = {
	'plant-dying.svg': plantSvg({health: 0, id: 'pd'}),
	'plant-glow.svg': plantSvg({health: 0, glow: 1, id: 'pg'}),
	'plant-healthy.svg': plantSvg({health: 1, id: 'ph'}),
	'plant-scan.svg': plantSvg({variant: 'scan', id: 'ps'}),
	'room-living.svg': roomSvg({variant: 'living', id: 'rl'}),
	'room-living-dying.svg': roomSvg({variant: 'living', plant: {health: 0}, id: 'rld'}),
	'room-living-healthy.svg': roomSvg({variant: 'living', plant: {health: 1}, id: 'rlh'}),
	'room-bedroom-dying.svg': roomSvg({variant: 'bedroom', plant: {health: 0.15}, id: 'rbd'}),
	'room-bedroom-healthy.svg': roomSvg({variant: 'bedroom', plant: {health: 1}, id: 'rbh'}),
	'room-corner-dying.svg': roomSvg({variant: 'corner', plant: {health: 0.1}, id: 'rcd'}),
	'room-corner-healthy.svg': roomSvg({variant: 'corner', plant: {health: 1}, id: 'rch'}),
};
for (const [name, svg] of Object.entries(files)) writeFileSync(join(OUT, name), svg);
console.log(`wrote ${Object.keys(files).length} files to ${OUT}`);
