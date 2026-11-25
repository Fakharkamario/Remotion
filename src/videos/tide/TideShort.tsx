// "the ocean that listens." — a frame-matched remake of an editorial
// motion piece (poster build → blur-smear → photo strip + cursor select →
// collage burst). Laid out on a 1280x720 stage (the reference's pixel space)
// and scaled to 1920x1080. Most motion is posterised to 15fps ("on twos")
// like the reference; the cursor and selection box run on ones.
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/inter/opsz-italic.css';
import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';

export const TIDE_FRAMES = 126;

const FONT = "'Inter Variable', Inter, sans-serif";
const BG = '#ECECE8';
const INK = '#151515';
const MUTED = '#8C8C88';
const img = (n: string) => staticFile(`tide/${n}.jpg`);

// ---------- helpers ----------
const OUT = Easing.out(Easing.cubic);
const kf = (t: number, f: number[], v: number[], easing = OUT) =>
	interpolate(t, f, v, {easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const JUNK = '!$%&*?<>-=3@#4+/^';
const hash = (a: number, b: number) => {
	const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
	return n - Math.floor(n);
};
/** `reveal` real characters followed by `junk` glyphs that change every step. */
const scr = (text: string, reveal: number, junk: number, seed: number) => {
	let out = text.slice(0, reveal);
	for (let k = 0; k < junk; k++) {
		const ch = text[reveal + k];
		out += ch === ' ' || ch === '\n' ? ch : JUNK[Math.floor(hash(seed, reveal + k) * JUNK.length)];
	}
	return out;
};
/** Progressive scramble-type over [from, to]. */
const typeOn = (text: string, t: number, from: number, to: number, seed: number) => {
	if (t < from) return '';
	const p = Math.min(1, (t - from) / Math.max(1, to - from));
	const reveal = Math.floor(p * text.length);
	return scr(text, reveal, Math.min(3, text.length - reveal), seed + t);
};
/** Steps through [frame, reveal, junk] keys (holds the last key reached). */
const typeSteps = (text: string, t: number, keys: [number, number, number][], seed: number) => {
	let cur: [number, number, number] | null = null;
	for (const k of keys) if (t >= k[0]) cur = k;
	return cur ? scr(text, cur[1], cur[2], seed + t) : '';
};

// ---------- stage pieces ----------
const Grid: React.FC = () => {
	const lines: React.ReactNode[] = [];
	for (let i = 0; i < 20; i++)
		lines.push(<div key={'v' + i} style={{position: 'absolute', left: 6.67 + i * 66.67, top: 0, width: 1, height: 720, background: '#DADAD5'}} />);
	for (let j = 0; j < 11; j++)
		lines.push(<div key={'h' + j} style={{position: 'absolute', top: 26.67 + j * 66.67, left: 0, height: 1, width: 1280, background: '#DADAD5'}} />);
	return <AbsoluteFill style={{background: BG}}>{lines}</AbsoluteFill>;
};

const Bracket: React.FC<{x: number; y: number; corner: 'tr' | 'bl'}> = ({x, y, corner}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: 25,
			height: 25,
			borderTop: corner === 'tr' ? `3px solid ${INK}` : undefined,
			borderRight: corner === 'tr' ? `3px solid ${INK}` : undefined,
			borderBottom: corner === 'bl' ? `3px solid ${INK}` : undefined,
			borderLeft: corner === 'bl' ? `3px solid ${INK}` : undefined,
		}}
	/>
);

const Arrow: React.FC<{x: number; y: number}> = ({x, y}) => (
	<svg style={{position: 'absolute', left: x, top: y}} width={27} height={27} viewBox="0 0 27 27">
		<path d="M3 24 L23 4 M8 4 H23 V19" stroke={INK} strokeWidth={2.6} fill="none" />
	</svg>
);

const Mono: React.FC<{x: number; y: number; children: React.ReactNode; size?: number}> = ({x, y, children, size = 13.5}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			fontFamily: FONT,
			fontStyle: 'italic',
			fontSize: size,
			lineHeight: '18px',
			color: INK,
			whiteSpace: 'pre',
			letterSpacing: '-0.01em',
		}}
	>
		{children}
	</div>
);

// ---------- scene 1: the poster ----------
const HEAD = ['the', 'ocean', 'that', 'listens.'];
const HEAD_STEPS: [number, number, number][][] = [
	[[6, 1, 2], [8, 3, 0]],
	[[6, 0, 1], [10, 3, 2], [12, 5, 0]],
	[[14, 1, 2], [16, 2, 1], [18, 4, 0]],
	[[18, 0, 1], [20, 1, 2], [22, 4, 2], [24, 8, 0]],
];
const PARAGRAPH =
	'Where the tide meets the shore, the world grows quiet. Waves arrive slowly, fold over and leave again, and my breath finds their rhythm. That stillness feels like an embrace, soothing and patient, listening to what was never said.';
const WORDS = PARAGRAPH.split(' ');
const SWATCH = ['#2F6075', '#1E4153', '#6EA2A5', '#D3C6A6'];

const Poster: React.FC<{t: number; imgDy?: number; noImage?: boolean}> = ({t, imgDy = 0, noImage = false}) => {
	// image: grows from its centre (974,360); content is a clipped reveal
	const s = kf(t, [4, 6, 8, 10, 12, 20, 30], [0.2375, 0.475, 0.71, 1.027, 1.03, 1.01, 1]);
	const cs = kf(t, [4, 6], [0.75, 1]);
	const iw = 480 * s, ih = 594 * s;
	const words = Math.round(kf(t, [10, 24], [6, WORDS.length], Easing.linear));

	const headX = kf(t, [6, 8, 12, 18, 24, 30], [25, 37, 45, 54, 59, 62]);
	const lbl = (i: number, x0: number, y0: number, x1: number) => ({
		x: kf(t, [6, 12], [x0, x1]),
		y: kf(t, [6, 12], [y0, 84]),
	});
	const labels = [lbl(0, 102, 112, 65), lbl(1, 33, 68, 94), lbl(2, 268, 85, 126), lbl(3, 353, 85, 154)];
	const labelText = ['find', 'your', 'own', 'tide'];

	const SF = [4, 6, 10, 12, 14, 16];
	const sw = [
		{x: [376, 376, 408, 421, 421, 435], y: [555, 538, 528, 539, 573, 566]},
		{x: [500, 500, 491, 475, 491, 479], y: [519, 540, 581, 581, 573, 566]},
		{x: [424, 424, 496, 541, 539, 523], y: [511, 556, 632, 624, 573, 566]},
		{x: [521, 540, 581, 581, 581, 567], y: [455, 455, 533, 581, 573, 566]},
	];

	return (
		<>
			{/* typing bar before the headline arrives */}
			{t >= 2 && t < 6 ? (
				<div style={{position: 'absolute', left: t < 4 ? 0 : 6, top: 238, width: t < 4 ? 30 : 48, height: 7, background: INK}} />
			) : null}

			{t >= 6
				? labels.map((p, i) => (
						<div key={i} style={{position: 'absolute', left: p.x, top: p.y, fontFamily: FONT, fontSize: 10, color: INK}}>
							{labelText[i]}
						</div>
					))
				: null}

			{/* headline */}
			<div
				style={{
					position: 'absolute',
					left: headX,
					top: 138,
					fontFamily: FONT,
					fontWeight: 560,
					fontSize: 100,
					lineHeight: '92.5px',
					letterSpacing: '-0.055em',
					color: INK,
					whiteSpace: 'pre',
				}}
			>
				{HEAD.map((w, i) => (
					<div key={i} style={{height: 92.5}}>
						{typeSteps(w, t, HEAD_STEPS[i], i * 17)}
					</div>
				))}
			</div>

			{/* ↗ 19 / 11 */}
			{t >= 4 ? (
				<>
					<Arrow x={kf(t, [4, 6, 8, 10], [472, 520, 579, 580])} y={kf(t, [4, 6, 8, 10], [185, 185, 165, 120])} />
					<div style={{position: 'absolute', left: kf(t, [4, 6, 8, 10], [523, 565, 621, 622]), top: kf(t, [4, 6, 8, 10], [58, 30, 70, 102]), fontFamily: FONT, fontWeight: 300, fontSize: 55, letterSpacing: '-0.04em', color: INK}}>
						19
					</div>
					<div style={{position: 'absolute', left: kf(t, [4, 6, 8, 10], [548, 545, 610, 628]), top: kf(t, [4, 6, 8, 10], [225, 175, 150, 155]), fontFamily: FONT, fontWeight: 300, fontSize: 55, letterSpacing: '-0.04em', color: INK}}>
						11
					</div>
					<Bracket corner="tr" x={kf(t, [4, 6, 8], [1104, 1182, 1220])} y={kf(t, [4, 6, 8], [178, 90, 45])} />
					<Bracket corner="bl" x={kf(t, [4, 6, 8], [822, 748, 710])} y={kf(t, [4, 6, 8], [519, 612, 659])} />

					{/* hero photo */}
					<div style={{position: 'absolute', left: 974 - iw / 2, top: 360 - ih / 2 + imgDy, width: iw, height: ih, overflow: 'hidden', display: noImage ? 'none' : undefined}}>
						<div
							style={{
								position: 'absolute',
								left: iw / 2 - 240,
								top: ih / 2 - 297,
								width: 480,
								height: 594,
								transform: `scale(${(cs * Math.max(s, 1))})`,
							}}
						>
							<Img src={img('hero')} style={{width: 480, height: 594, objectFit: 'cover'}} />
							{t >= 10 ? (
								<div
									style={{
										position: 'absolute',
										left: 23,
										top: 35,
										width: 243,
										fontFamily: FONT,
										fontSize: 15,
										fontWeight: 300,
										lineHeight: '22.4px',
										color: 'rgba(255,255,255,0.93)',
										textAlign: 'justify',
										letterSpacing: '0.005em',
									}}
								>
									{WORDS.map((w, i) => (
										<span key={i} style={{visibility: i < words ? 'visible' : 'hidden'}}>
											{i === words - 1 && words < WORDS.length ? scr(w, Math.max(0, w.length - 2), Math.min(2, w.length), t) : w}{' '}
										</span>
									))}
								</div>
							) : null}
						</div>
					</div>

					{/* swatches + label */}
					{sw.map((p, i) => (
						<div key={i} style={{position: 'absolute', left: kf(t, SF, p.x), top: kf(t, SF, p.y), width: 33, height: 33, background: SWATCH[i]}} />
					))}
					<Mono x={kf(t, [4, 6, 10], [422, 441, 613])} y={574}>colors&gt;/</Mono>
				</>
			) : null}

			{/* code-ish annotations */}
			<Mono x={240} y={147}>{typeOn('hushhh-h\nw4v3>\ntide!$', t, 10, 22, 3)}</Mono>
			<Mono x={465} y={278}>
				{(() => {
					const s1 = typeOn('create-s&|ur4ff ent', t, 10, 20, 5);
					const s2 = typeOn('>3ing', t, 18, 22, 6);
					const s3 = typeOn('!$', t, 20, 22, 7);
					return (
						<>
							{s1}
							<span style={{color: MUTED}}>{s2}</span>
							{s3}
						</>
					);
				})()}
			</Mono>
			<Mono x={318} y={384}>
				{typeOn('shore', t, 12, 16, 8)}
				<span style={{color: MUTED}}>{typeOn('<photo>', t, 15, 20, 9)}</span>
				{typeOn('|breath', t, 18, 24, 10)}
			</Mono>
			<Mono x={74} y={574}>
				{typeOn('breath', t, 14, 16, 11)}
				<span style={{color: MUTED}}>{typeOn('*focus', t, 16, 18, 12)}</span>
				{typeOn('>"drift', t, 17, 20, 13)}
				<span style={{color: MUTED}}>{typeOn('*/out>', t, 19, 21, 14)}</span>
				{typeOn('!|mind', t, 20, 22, 15)}
				{'\n'}
				{typeOn('>take1', t, 20, 22, 16)}
				<span style={{color: MUTED}}>{typeOn('<right', t, 22, 24, 17)}</span>
				{typeOn(' da4id?', t, 23, 26, 18)}
			</Mono>
		</>
	);
};

// ---------- scene 2: the strip ----------
const QF = [40, 42, 46, 56, 60, 64, 66];
const QUOTES = [
	{text: 'Listening to the waves helps me focus.', x: [300, 288, 296, 53, 24, -4, -200], y: [40, 17, 75, 109, 109, 109, 109], sf: [60, 62], sv: [0, 1]},
	{text: 'Sometimes, all you need is the sound of water.', x: [920, 900, 887, 955, 987, 1103, 1240], y: [5, 56, 111, 145, 145, 145, 145], sf: [99, 100], sv: [0, 0]},
	{text: 'The smell of salt makes me feel at home.', x: [145, 178, 199, 57, 29, -40, -230], y: [522, 538, 560, 584, 584, 584, 584], sf: [60, 62, 64], sv: [0, 0.6, 1]},
	{text: 'Breathe in with the tide, breathe out with the waves.', x: [591, 596, 611, 778, 815, 948, 1080], y: [561, 574, 593, 616, 616, 616, 616], sf: [58, 60, 62], sv: [0, 0.6, 1]},
	{text: 'Sea air can lift my mood and energy.', x: [852, 838, 832, 924, 945, 1038, 1150], y: [496, 514, 537, 561, 561, 561, 561], sf: [58, 60, 64, 66], sv: [0, 0.6, 0.7, 1]},
];

type Rect = {f: number[]; x: number[]; y: number[]; w: number[]; h: number[]};
const STRIP: {src: string; r: Rect}[] = [
	{src: 'sunset', r: {f: [50, 56], x: [40, -100], y: [330, 268], w: [25, 141], h: [25, 184]}},
	{src: 'shore', r: {f: [44, 46, 52], x: [190, 137, 96], y: [320, 280, 268], w: [25, 99, 145], h: [25, 102, 184]}},
	{src: 'twist', r: {f: [42, 44, 46, 52], x: [449, 358, 317, 286], y: [280, 262, 261, 268], w: [25, 106, 138, 151], h: [25, 109, 140, 184]}},
	{src: 'caustic', r: {f: [42, 44, 46, 52], x: [753, 784, 787, 810], y: [280, 262, 261, 268], w: [25, 120, 138, 180], h: [25, 109, 140, 184]}},
	{src: 'foam', r: {f: [44, 46, 52], x: [1050, 1008, 1008], y: [320, 280, 268], w: [25, 100, 178], h: [25, 102, 184]}},
	{src: 'drops', r: {f: [46, 56], x: [1245, 1205], y: [319, 268], w: [25, 150], h: [25, 184]}},
];
const CENTER: Rect = {f: [42, 44, 46, 56], x: [584, 528, 517, 490], y: [240, 218, 216, 220], w: [112, 214, 246, 300], h: [105, 192, 230, 280]};

const BOX = {
	f: [59, 60, 61, 62, 63, 64, 66, 68, 70, 72, 74],
	x: [620, 587, 525, 488, 467, 453, 435, 424, 416, 408, 389],
	y: [340, 310, 251, 219, 197, 187, 171, 160, 152, 141, 120],
	w: [36, 102, 227, 301, 341, 371, 405, 427, 443, 459, 497],
	h: [33, 92, 208, 280, 312, 336, 368, 387, 400, 416, 451],
};
const CURSOR = {
	f: [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 62, 64, 66, 68, 70, 71],
	x: [315, 330, 390, 485, 560, 600, 621, 635, 643, 648, 648, 651, 651, 646, 654, 688, 790, 941, 973],
	y: [688, 685, 672, 630, 581, 536, 499, 472, 448, 432, 419, 405, 393, 386, 399, 432, 535, 680, 712],
};

const Cursor: React.FC<{x: number; y: number; rot: number; squash: number}> = ({x, y, rot, squash}) => (
	<svg
		style={{position: 'absolute', left: x - 2, top: y - 2, transform: `rotate(${rot}deg) scaleX(${squash})`, transformOrigin: '6px 14px'}}
		width={22}
		height={30}
		viewBox="0 0 22 30"
	>
		<path d="M2 2 L2 24 L7.5 18.5 L11.5 27.5 L15 26 L11 17.5 L18.5 17.5 Z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
	</svg>
);

const rectAt = (r: Rect, t: number) => ({
	x: kf(t, r.f, r.x),
	y: kf(t, r.f, r.y),
	w: kf(t, r.f, r.w),
	h: kf(t, r.f, r.h),
});

const Tile: React.FC<{src: string; x: number; y: number; w: number; h: number; style?: React.CSSProperties}> = ({src, x, y, w, h, style}) => (
	<div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', ...style}}>
		<Img src={img(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
	</div>
);

const Strip: React.FC<{t: number; frame: number}> = ({t, frame}) => {
	// tiles converge into the selection and slide under it
	const shift = kf(t, [62, 64, 66], [0, 48, 175], Easing.linear);
	const c = rectAt(CENTER, t);
	const showBox = frame >= 59 && frame < 76;
	const bx = {x: kf(frame, BOX.f, BOX.x, Easing.linear), y: kf(frame, BOX.f, BOX.y, Easing.linear), w: kf(frame, BOX.f, BOX.w, Easing.linear), h: kf(frame, BOX.f, BOX.h, Easing.linear)};
	const blueVeil = kf(frame, [59, 60, 62], [0.85, 0.75, 0]);
	const tint = t < 70 ? 'ribbon-coral' : t < 72 ? 'ribbon-sage' : 'ribbon-sky';
	const whiten = kf(frame, [72, 75], [0, 0.62], Easing.linear);
	const cur = {x: kf(frame, CURSOR.f, CURSOR.x, Easing.linear), y: kf(frame, CURSOR.f, CURSOR.y, Easing.linear)};
	// entry streak: the cursor arrives as a thin sliver, then unfolds (frames 44-48)
	const cRot = kf(frame, [44, 45, 46, 47, 48], [65, 65, 45, 15, 0], Easing.linear);
	const cSquash = kf(frame, [44, 45, 46, 47, 48], [0.2, 0.2, 0.3, 0.8, 1], Easing.linear);

	return (
		<>
			{t < 68
				? STRIP.map((s, i) => {
						if (t < s.r.f[0]) return null;
						const r = rectAt(s.r, t);
						const left = r.x + r.w / 2 < 640;
						return <Tile key={i} src={s.src} x={r.x + (left ? shift : -shift)} y={r.y} w={r.w} h={r.h} />;
					})
				: null}
			{t === 68 ? (
				<>
					<Tile src="caustic" x={294} y={268} w={132} h={184} />
					<Tile src="twist" x={794} y={268} w={140} h={184} style={{filter: 'hue-rotate(25deg) saturate(1.2)'}} />
				</>
			) : null}
			{t >= 42 && frame < 62 ? <Tile src="ribbon" {...c} /> : null}

			{QUOTES.map((q, i) => {
				if (t < 40 || t >= 68) return null;
				const p = kf(t, [40, 42, 46], [0.25, 0.7, 1], Easing.linear);
				const reveal = Math.floor(q.text.length * p);
				const txt = scr(q.text, reveal, Math.min(q.text.length - reveal, Math.ceil(q.text.length * 0.25)), i * 31 + t);
				const sm = kf(t, q.sf, q.sv, Easing.linear);
				const vis = t < 42 && i === 0 ? 0 : 1;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: kf(t, QF, q.x, Easing.linear),
							top: kf(t, QF, q.y, Easing.linear) - 9,
							fontFamily: FONT,
							fontStyle: 'italic',
							fontSize: 14,
							lineHeight: '18px',
							whiteSpace: 'pre',
							color: t < 42 ? '#666' : INK,
							opacity: vis,
							fontWeight: 400 + sm * 500,
							letterSpacing: `${-0.01 - (sm > 0.65 ? 0.08 + (sm - 0.65) * 0.25 : sm * 0.12)}em`,
							transform: `scaleX(${1 - sm * 0.12})`,
							textShadow: sm > 0.65 ? '1px 0 0 #111, 2px 0 0 #111, -1px 0 0 #111, 0 0.5px 0 #111' : undefined,
							transformOrigin: 'left center',
							filter: sm > 0.7 ? 'blur(0.4px)' : undefined,
						}}
					>
						{txt}
					</div>
				);
			})}

			{showBox ? (
				<div style={{position: 'absolute', left: bx.x, top: bx.y, width: bx.w, height: bx.h, overflow: 'hidden', border: '1.5px solid #5B8DEF', boxSizing: 'border-box'}}>
					<Img src={img(tint)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: tint === 'ribbon-coral' ? 'saturate(1.9) brightness(1.12) contrast(1.05)' : undefined}} />
					{tint === 'ribbon-sage' ? (
						<Img src={img('ribbon-coral')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.6) brightness(1.08)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 45%, black 85%)', maskImage: 'linear-gradient(to bottom, transparent 45%, black 85%)'}} />
					) : null}
					<div style={{position: 'absolute', inset: 0, background: '#7EA5EC', opacity: blueVeil}} />
					<div style={{position: 'absolute', inset: 0, background: '#EEF2F8', opacity: whiten}} />
				</div>
			) : null}

			{frame >= 44 && frame < 72 ? <Cursor x={cur.x} y={cur.y} rot={cRot} squash={cSquash} /> : null}
		</>
	);
};

// ---------- scene 3: the collage ----------
// Tile boxes [x0, y0, x1, y1] measured from the reference at full resolution. The stack trades
// places as it settles: the twist sinks from top-right to bottom-centre, the light-rays tile climbs
// from bottom-right to top-left, the curled sheets swing left then rise behind everything.
const CF = [78, 80, 84, 88, 92, 96, 100, 110];
type Box = [number, number, number, number];
type CT = {src: string; z: (t: number) => number; ry: number; rx: number; k: Box[]};
const COLLAGE: CT[] = [
	{src: 'caustic', z: () => 0.1, ry: -8, rx: 4, k: [[517, 115, 615, 285], [512, 50, 632, 265], [600, 15, 757, 260], [736, 125, 935, 272], [755, 283, 990, 522], [730, 375, 945, 610], [690, 478, 907, 655], [705, 455, 846, 690]]},
	{src: 'foam', z: () => 0.3, ry: 10, rx: -3, k: [[398, 205, 568, 388], [350, 140, 550, 305], [380, 28, 570, 295], [603, -10, 718, 258], [697, 65, 880, 342], [741, 155, 955, 425], [749, 215, 986, 478], [744, 285, 998, 548]]},
	// the drops tile passes from under the curled sheets to over them mid-move
	{src: 'drops', z: (t) => (t < 98 ? 0.6 : 2.5), ry: 12, rx: 3, k: [[415, 338, 590, 535], [340, 310, 568, 552], [260, 197, 545, 482], [332, 18, 603, 195], [490, -40, 718, 262], [650, -20, 813, 282], [688, 12, 875, 312], [700, 67, 941, 362]]},
	{src: 'ribbon', z: () => 1, ry: -10, rx: -4, k: [[520, 375, 755, 652], [468, 378, 755, 712], [343, 330, 683, 718], [190, 200, 615, 575], [212, 30, 612, 415], [297, -40, 650, 342], [360, -30, 690, 318], [437, -20, 750, 310]]},
	{src: 'rays', z: () => 3, ry: 9, rx: 3, k: [[655, 372, 845, 585], [647, 390, 872, 655], [576, 428, 812, 720], [388, 383, 653, 713], [238, 248, 566, 592], [217, 147, 563, 495], [235, 85, 580, 437], [275, 20, 602, 365]]},
	{src: 'shore', z: () => 4, ry: 12, rx: -3, k: [[655, 235, 905, 470], [695, 230, 972, 520], [683, 425, 985, 635], [600, 415, 858, 760], [448, 400, 632, 760], [345, 343, 632, 698], [295, 290, 598, 655], [233, 225, 573, 588]]},
	{src: 'twist', z: () => 5, ry: -9, rx: 2, k: [[615, 100, 805, 355], [628, 55, 872, 370], [683, 98, 990, 428], [680, 268, 1030, 595], [633, 385, 922, 760], [555, 410, 830, 750], [498, 405, 772, 750], [425, 383, 705, 750]]},
];

const Collage: React.FC<{t: number}> = ({t}) => {
	// burst: the frame-78 cluster grows out of the selection's centre
	const g = kf(t, [72, 74, 76, 78], [0, 0.04, 0.38, 1]);
	const ox = kf(t, [74, 78], [643, 651], Easing.linear), oy = kf(t, [74, 78], [366, 376], Easing.linear);
	const motion = kf(t, [78, 110], [0, 1], Easing.linear); // how far through the shuffle
	const drift = kf(t, [110, 121], [0, 5], Easing.linear);
	const tiles = [...COLLAGE].sort((a, b) => a.z(t) - b.z(t));
	return (
		<div style={{position: 'absolute', inset: 0, transformOrigin: `651px 376px`, transform: `translate(${ox - 651}px, ${oy - 376}px) scale(${g})`}}>
			{tiles.map((c) => {
				// linear between the 4-frame keys, ease out into the final rest pose
				const at = (j: number) =>
					t <= 100 ? kf(t, CF.slice(0, 7), c.k.slice(0, 7).map((b) => b[j]), Easing.linear) : kf(t, [100, 110], [c.k[6][j], c.k[7][j]], OUT);
				const x0 = at(0), y0 = at(1) - drift, x1 = at(2), y1 = at(3) - drift;
				// tilt is strongest mid-shuffle and relaxes as the stack settles
				const tilt = 0.7 + 0.6 * Math.sin(Math.PI * motion);
				return (
					<div
						key={c.src}
						style={{
							position: 'absolute',
							left: x0,
							top: y0,
							width: x1 - x0,
							height: y1 - y0,
							overflow: 'hidden',
							transform: `perspective(700px) rotateY(${c.ry * tilt}deg) rotateX(${c.rx * tilt}deg)`,
							backfaceVisibility: 'hidden',
						}}
					>
						<Img src={img(c.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
					</div>
				);
			})}
		</div>
	);
};

// ---------- main ----------
export const TideShort: React.FC = () => {
	const frame = useCurrentFrame();
	const t = Math.floor(frame / 2) * 2; // on twos

	// scene 1 → 2 transition: drop + blur + vertical smear
	const drop = kf(t, [32, 34, 36, 38], [0, 8, 64, 200], Easing.in(Easing.quad));
	const stageBlur = t < 34 ? 0 : t < 40 ? kf(t, [34, 36, 38], [1, 2.5, 5], Easing.linear) : kf(t, [40, 42, 44], [6, 2, 0], Easing.linear);
	const smear = t === 38;
	const dim = kf(t, [60, 62, 74, 76], [0, 0.07, 0.07, 0], Easing.linear);
	const ring = kf(t, [72, 74, 76, 80, 82, 84], [0, 0.6, 1, 0.8, 0.4, 0], Easing.linear);

	return (
		<AbsoluteFill style={{background: BG}}>
			<Audio src={staticFile('audio/music.wav')} volume={(f) => kf(f, [0, 6, 110, 125], [0, 0.55, 0.55, 0], Easing.linear)} />
			<Sequence from={6} durationInFrames={20}><Audio src={staticFile('audio/typing.wav')} volume={0.35} /></Sequence>
			<Sequence from={33}><Audio src={staticFile('audio/whoosh-out.wav')} volume={0.5} /></Sequence>
			<Sequence from={58}><Audio src={staticFile('audio/tap.wav')} volume={0.6} /></Sequence>
			<Sequence from={72}><Audio src={staticFile('audio/whoosh-big.wav')} volume={0.5} /></Sequence>

			<div style={{position: 'absolute', left: 0, top: 0, width: 1280, height: 720, transform: 'scale(1.5)', transformOrigin: '0 0', overflow: 'hidden', filter: stageBlur ? `blur(${stageBlur}px)` : undefined}}>
				<Grid />
				<AbsoluteFill style={{background: '#000', opacity: dim}} />
				{ring > 0 ? (
					<Img src={staticFile('tide/ring.png')} style={{position: 'absolute', inset: 0, width: 1280, height: 720, opacity: ring, transform: `scale(${kf(t, [72, 84], [0.96, 1.08])})`}} />
				) : null}

				{t < 40 ? (
					<>
						{smear
							? [1, 2, 3, 4, 5, 6].map((k) => (
									<div key={k} style={{position: 'absolute', inset: 0, transform: `translateY(${drop + k * 7}px)`, opacity: 0.2}}>
										<Poster t={t} noImage />
									</div>
								))
							: null}
						<div style={{position: 'absolute', inset: 0, transform: `translateY(${drop}px)`, opacity: kf(t, [34, 38], [1, 0.75], Easing.linear)}}>
							{/* the photo lags the type: it drops only about a third as far */}
							<Poster t={t} imgDy={-drop * 0.65} />
						</div>
					</>
				) : null}

				{t >= 40 && t < 76 ? <Strip t={t} frame={frame} /> : null}
				{t >= 72 && frame < 122 ? <Collage t={frame >= 74 ? t : 72} /> : null}
			</div>
		</AbsoluteFill>
	);
};
