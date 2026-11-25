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
const INOUT = Easing.inOut(Easing.cubic);
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

	const sw = [
		{f: [4, 6, 10, 16], x: [376, 376, 405, 435], y: [555, 538, 552, 566]},
		{f: [4, 6, 10, 16], x: [500, 500, 490, 479], y: [519, 540, 553, 566]},
		{f: [4, 6, 10, 16], x: [424, 424, 474, 523], y: [511, 556, 561, 566]},
		{f: [4, 6, 10, 16], x: [521, 540, 553, 567], y: [455, 455, 510, 566]},
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
										fontSize: 15.5,
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
						<div key={i} style={{position: 'absolute', left: kf(t, p.f, p.x), top: kf(t, p.f, p.y), width: 33, height: 33, background: SWATCH[i]}} />
					))}
					<Mono x={kf(t, [4, 6, 16], [422, 441, 613])} y={574}>colors&gt;/</Mono>
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
const QUOTES = [
	{text: 'Listening to the waves helps me focus.', f: [40, 42, 46, 56, 60, 64], x: [300, 288, 296, 53, 24, -4], y: [40, 17, 75, 109, 109, 109], smear: 62},
	{text: 'Sometimes, all you need is the sound of water.', f: [40, 42, 46, 56, 60, 64], x: [920, 900, 887, 955, 987, 1103], y: [5, 56, 111, 145, 145, 145], smear: 62},
	{text: 'The smell of salt makes me feel at home.', f: [40, 42, 46, 56, 60, 64], x: [145, 178, 199, 57, 29, -40], y: [522, 538, 560, 584, 584, 584], smear: 62},
	{text: 'Breathe in with the tide, breathe out with the waves.', f: [40, 42, 46, 56, 60, 64], x: [591, 596, 611, 778, 815, 948], y: [561, 574, 593, 616, 616, 616], smear: 58},
	{text: 'Sea air can lift my mood and energy.', f: [40, 42, 46, 56, 60, 64], x: [852, 838, 832, 924, 945, 1038], y: [496, 514, 537, 561, 561, 561], smear: 58},
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
	const conv = kf(t, [62, 64, 66, 68, 70], [0, 0.1, 0.37, 0.45, 1], Easing.linear);
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
			{t < 70
				? STRIP.map((s, i) => {
						if (t < s.r.f[0]) return null;
						const r = rectAt(s.r, t);
						const cx = r.x + r.w / 2;
						return <Tile key={i} src={s.src} x={r.x + (640 - cx) * conv} y={r.y} w={r.w} h={r.h} />;
					})
				: null}
			{t >= 42 && frame < 62 ? <Tile src="ribbon" {...c} /> : null}

			{QUOTES.map((q, i) => {
				if (t < 40 || t >= 66) return null;
				const p = kf(t, [40, 42, 46], [0.25, 0.7, 1], Easing.linear);
				const reveal = Math.floor(q.text.length * p);
				const txt = scr(q.text, reveal, Math.min(q.text.length - reveal, Math.ceil(q.text.length * 0.25)), i * 31 + t);
				const sm = kf(t, [q.smear, q.smear + 2, q.smear + 4], [0, 0.6, 1], Easing.linear);
				const vis = t < 42 && i === 0 ? 0 : 1;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: kf(t, q.f, q.x, Easing.linear),
							top: kf(t, q.f, q.y, Easing.linear) - 9,
							fontFamily: FONT,
							fontStyle: 'italic',
							fontSize: 14,
							lineHeight: '18px',
							whiteSpace: 'pre',
							color: t < 42 ? '#666' : INK,
							opacity: vis,
							fontWeight: 400 + sm * 500,
							letterSpacing: `${-0.01 - sm * 0.13}em`,
							transform: `scaleX(${1 - sm * 0.12})`,
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
					<Img src={img('ribbon-coral')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
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
type CT = {src: string; x: number; y: number; w: number; h: number; ry: number; rx: number; z: number};
// final (settled) layout in stage pixels
const COLLAGE: CT[] = [
	{src: 'sunset', x: 560, y: -60, w: 230, h: 200, ry: 6, rx: 3, z: 0},
	{src: 'ribbon', x: 453, y: 0, w: 320, h: 267, ry: -5, rx: 2, z: 1},
	{src: 'rays', x: 288, y: 8, w: 315, h: 259, ry: 7, rx: -3, z: 3},
	{src: 'drops', x: 773, y: 80, w: 182, h: 293, ry: -8, rx: 2, z: 2},
	{src: 'sand', x: 470, y: 330, w: 210, h: 240, ry: 4, rx: 2, z: 2},
	{src: 'shore', x: 227, y: 200, w: 346, h: 373, ry: 8, rx: -2, z: 4},
	{src: 'foam', x: 733, y: 293, w: 259, h: 267, ry: -6, rx: 3, z: 5},
	{src: 'caustic', x: 699, y: 520, w: 141, h: 173, ry: -4, rx: -3, z: 6},
	{src: 'twist', x: 413, y: 400, w: 286, h: 330, ry: 3, rx: -2, z: 7},
];

const Collage: React.FC<{t: number}> = ({t}) => {
	const g = kf(t, [72, 74, 76, 78, 80, 86, 92, 104, 121], [0.0, 0.06, 0.32, 0.78, 0.92, 1.22, 1.28, 1.1, 1.06]);
	const spread = kf(t, [78, 108], [0, 1], INOUT);
	const drift = kf(t, [76, 84, 121], [40, 20, 0]);
	return (
		<div style={{position: 'absolute', inset: 0, perspective: 1400, transform: `translateY(${drift}px)`}}>
			<div style={{position: 'absolute', inset: 0, transformOrigin: '640px 360px', transform: `scale(${g})`}}>
				{[...COLLAGE].sort((a, b) => a.z - b.z).map((c, i) => {
					const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
					// compact: pulled toward the centre, a little smaller, more tilted
					const k = 0.62 + 0.38 * spread;
					const kx = 0.8 + 0.2 * spread;
					const ncx = 610 + (cx - 610) * kx + (1 - spread) * 30;
					const ncy = 360 + (cy - 360) * k;
					const sc = 0.88 + 0.12 * spread;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: ncx - c.w / 2,
								top: ncy - c.h / 2,
								width: c.w,
								height: c.h,
								overflow: 'hidden',
								transform: `scale(${sc}) rotateY(${c.ry * (2.2 - 0.8 * spread)}deg) rotateX(${c.rx * 1.5}deg)`,
								boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
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
