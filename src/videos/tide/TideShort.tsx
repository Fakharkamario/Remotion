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

const Poster: React.FC<{t: number}> = ({t}) => {
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
					<div style={{position: 'absolute', left: 974 - iw / 2, top: 360 - ih / 2, width: iw, height: ih, overflow: 'hidden'}}>
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
	{src: 'twist', r: {f: [42, 46, 52], x: [449, 317, 286], y: [280, 261, 268], w: [25, 138, 151], h: [25, 140, 184]}},
	{src: 'caustic', r: {f: [42, 46, 52], x: [753, 787, 810], y: [280, 261, 268], w: [25, 138, 180], h: [25, 140, 184]}},
	{src: 'foam', r: {f: [44, 46, 52], x: [1050, 1008, 1008], y: [320, 280, 268], w: [25, 100, 178], h: [25, 102, 184]}},
	{src: 'drops', r: {f: [46, 56], x: [1245, 1205], y: [319, 268], w: [25, 150], h: [25, 184]}},
];
const CENTER: Rect = {f: [42, 46, 56], x: [584, 517, 490], y: [240, 216, 220], w: [112, 246, 300], h: [105, 230, 280]};

const BOX = {
	f: [60, 61, 62, 63, 64, 66, 68, 70, 72, 74],
	x: [587, 525, 488, 467, 453, 435, 424, 416, 408, 389],
	y: [310, 251, 219, 197, 187, 171, 160, 152, 141, 120],
	w: [102, 227, 301, 341, 371, 405, 427, 443, 459, 497],
	h: [92, 208, 280, 312, 336, 368, 387, 400, 416, 451],
};
const CURSOR = {
	f: [44, 48, 49, 50, 51, 52, 53, 54, 55, 56, 62, 64, 66, 68, 70, 71],
	x: [390, 560, 600, 621, 635, 643, 648, 648, 651, 651, 646, 654, 688, 790, 941, 973],
	y: [672, 581, 536, 499, 472, 448, 432, 419, 405, 393, 386, 399, 432, 535, 680, 712],
};

const Cursor: React.FC<{x: number; y: number; streak: number}> = ({x, y, streak}) => (
	<svg
		style={{position: 'absolute', left: x - 2, top: y - 2, transform: `rotate(${streak * 35}deg) scaleY(${1 + streak * 1.4})`, filter: streak > 0 ? `blur(${streak}px)` : undefined, transformOrigin: '2px 2px'}}
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
	const showBox = frame >= 60 && frame < 76;
	const bx = {x: kf(frame, BOX.f, BOX.x, Easing.linear), y: kf(frame, BOX.f, BOX.y, Easing.linear), w: kf(frame, BOX.f, BOX.w, Easing.linear), h: kf(frame, BOX.f, BOX.h, Easing.linear)};
	const blueVeil = kf(frame, [60, 62], [0.85, 0]);
	const toSky = kf(t, [66, 70], [0, 1], Easing.linear);
	const whiten = kf(frame, [72, 75], [0, 0.62], Easing.linear);
	const cur = {x: kf(frame, CURSOR.f, CURSOR.x, Easing.linear), y: kf(frame, CURSOR.f, CURSOR.y, Easing.linear)};
	const streak = kf(frame, [44, 47], [1, 0], Easing.linear);

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
					<Img src={img('ribbon-coral')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.9) brightness(1.12) contrast(1.05)'}} />
					<Img src={img('ribbon-sky')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: toSky}} />
					<div style={{position: 'absolute', inset: 0, background: '#7EA5EC', opacity: blueVeil}} />
					<div style={{position: 'absolute', inset: 0, background: '#EEF2F8', opacity: whiten}} />
				</div>
			) : null}

			{frame >= 44 && frame < 72 ? <Cursor x={cur.x} y={cur.y} streak={streak} /> : null}
		</>
	);
};

// ---------- scene 3: the collage ----------
// Each tile's box [x0, y0, x1, y1] at frames 80, 84, 88, 96, 104 — measured from the reference,
// where the tiles trade places (the twist sinks, the light-rays tile rises) as the stack settles.
const CF = [80, 84, 88, 96, 104];
type CT = {src: string; z: number; ry: number; rx: number; k: [number, number, number, number][]; fade?: number};
const COLLAGE: CT[] = [
	{src: 'ribbon', z: 0, ry: -6, rx: 3, k: [[464, 368, 784, 704], [336, 336, 688, 720], [192, 192, 608, 576], [304, -140, 640, 192], [448, -60, 752, 208]]},
	{src: 'sunset', z: 1, ry: 8, rx: 2, k: [[816, 230, 976, 448], [880, 300, 1000, 520], [900, 400, 1010, 620], [900, 420, 1000, 620], [900, 420, 1000, 620]], fade: 88},
	{src: 'rays', z: 1, ry: 7, rx: -3, k: [[640, 400, 816, 656], [560, 432, 816, 704], [384, 384, 656, 720], [218, 144, 576, 432], [240, 16, 592, 288]]},
	{src: 'drops', z: 2, ry: -8, rx: 2, k: [[346, 304, 576, 528], [256, 192, 544, 480], [336, 16, 608, 208], [656, -60, 816, 272], [742, 64, 944, 416]]},
	{src: 'foam', z: 3, ry: -6, rx: 3, k: [[346, 134, 560, 320], [384, 32, 576, 288], [608, 0, 720, 272], [736, 160, 960, 544], [736, 288, 992, 640]]},
	{src: 'shore', z: 4, ry: 9, rx: -2, k: [[672, 384, 960, 624], [576, 416, 960, 704], [608, 432, 864, 720], [352, 336, 736, 720], [240, 224, 592, 592]]},
	{src: 'caustic', z: 5, ry: -5, rx: -3, k: [[528, 58, 656, 256], [592, 16, 752, 256], [720, 112, 928, 320], [816, 416, 960, 624], [704, 544, 864, 720]]},
	{src: 'twist', z: 6, ry: 4, rx: -2, k: [[624, 58, 880, 368], [688, 96, 992, 512], [688, 272, 1024, 608], [560, 400, 832, 720], [432, 400, 720, 740]]},
];

const Collage: React.FC<{t: number}> = ({t}) => {
	// burst: the frame-80 cluster grows out of the selection's centre
	const g = kf(t, [72, 74, 76, 78, 80], [0, 0.06, 0.32, 0.78, 1]);
	const ox = kf(t, [74, 80], [643, 661], Easing.linear), oy = kf(t, [74, 80], [366, 381], Easing.linear);
	const settle = kf(t, [104, 121], [0, 1]);
	return (
		<div style={{position: 'absolute', inset: 0, perspective: 1400}}>
			<div style={{position: 'absolute', inset: 0, transformOrigin: '661px 381px', transform: `translate(${ox - 661}px, ${oy - 381}px) scale(${g})`}}>
				{[...COLLAGE].sort((a, b) => a.z - b.z).map((c, i) => {
					const at = (j: number) => kf(t, CF, c.k.map((b) => b[j]), Easing.linear);
					const x0 = at(0), y0 = at(1) - settle * 6, x1 = at(2), y1 = at(3) - settle * 6;
					if (c.fade && t >= c.fade + 2) return null;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x0,
								top: y0,
								width: x1 - x0,
								height: y1 - y0,
								overflow: 'hidden',
								transform: `rotateY(${c.ry}deg) rotateX(${c.rx}deg)`,
							}}
						>
							<Img src={img(c.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
						</div>
					);
				})}
			</div>
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
									<div key={k} style={{position: 'absolute', inset: 0, transform: `translateY(${drop - k * 22}px)`, opacity: 0.16}}>
										<Poster t={t} />
									</div>
								))
							: null}
						<div style={{position: 'absolute', inset: 0, transform: `translateY(${drop}px)`, opacity: kf(t, [34, 38], [1, 0.75], Easing.linear)}}>
							<Poster t={t} />
						</div>
					</>
				) : null}

				{t >= 40 && t < 76 ? <Strip t={t} frame={frame} /> : null}
				{t >= 72 && frame < 122 ? <Collage t={frame >= 74 ? t : 72} /> : null}
			</div>
		</AbsoluteFill>
	);
};
