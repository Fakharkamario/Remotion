import React from 'react';
import {Plant} from './Plant';

export type RoomVariant = 'living' | 'bedroom' | 'corner';

type Props = {
	variant?: RoomVariant;
	health: number;
	glow?: number;
	/** 0..1 how warm / sunlit the room is */
	sun?: number;
	id?: string;
	showPlant?: boolean;
};

// Abstract geometric artwork for the wall frames.
const Art: React.FC<{x: number; y: number; w: number; h: number; kind: number}> = ({
	x,
	y,
	w,
	h,
	kind,
}) => {
	const pad = w * 0.1;
	const ix = x + pad;
	const iy = y + pad;
	const iw = w - pad * 2;
	const ih = h - pad * 2;
	const dark = '#24432C';
	const mid = '#5E8466';
	return (
		<g>
			<rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill="#1D1B18" rx={2} />
			<rect x={x} y={y} width={w} height={h} fill="#EAE6D8" />
			<rect x={ix} y={iy} width={iw} height={ih} fill="#D9DCC9" />
			{kind === 0 ? (
				<>
					<rect x={ix} y={iy} width={iw * 0.45} height={ih} fill={dark} />
					<circle cx={ix + iw * 0.45} cy={iy + ih * 0.5} r={iw * 0.3} fill={mid} />
					<rect x={ix + iw * 0.65} y={iy + ih * 0.6} width={iw * 0.35} height={ih * 0.4} fill={dark} />
				</>
			) : kind === 1 ? (
				<>
					<path
						d={`M${ix},${iy + ih} L${ix},${iy + ih * 0.45} A${iw * 0.5},${iw * 0.5} 0 0 1 ${ix + iw},${iy + ih * 0.45} L${ix + iw},${iy + ih} Z`}
						fill={dark}
					/>
					<rect x={ix + iw * 0.3} y={iy + ih * 0.55} width={iw * 0.4} height={ih * 0.45} fill={mid} />
				</>
			) : kind === 2 ? (
				<>
					<rect x={ix} y={iy} width={iw} height={ih * 0.5} fill={mid} />
					<rect x={ix + iw * 0.2} y={iy + ih * 0.25} width={iw * 0.6} height={ih * 0.5} fill={dark} />
				</>
			) : (
				<>
					{[0, 1, 2].map((i) => (
						<path
							key={i}
							d={`M${ix + iw * (0.15 + i * 0.25)},${iy + ih} L${ix + iw * (0.15 + i * 0.25)},${iy + ih * 0.4} A${iw * 0.1},${iw * 0.1} 0 0 1 ${ix + iw * (0.35 + i * 0.25)},${iy + ih * 0.4} L${ix + iw * (0.35 + i * 0.25)},${iy + ih}`}
							fill="none"
							stroke={i === 1 ? mid : dark}
							strokeWidth={iw * 0.07}
						/>
					))}
				</>
			)}
		</g>
	);
};

const SmallPlant: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		{[-50, -25, 0, 25, 50].map((a, i) => (
			<ellipse
				key={i}
				cx={0}
				cy={-38}
				rx={11}
				ry={34}
				fill={i % 2 ? '#3E7A3A' : '#2D5E2C'}
				transform={`rotate(${a} 0 0)`}
			/>
		))}
		<path d="M-22,0 L22,0 L17,34 L-17,34 Z" fill="#C9B79A" />
	</g>
);

const SnakePlant: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		{[-18, -9, -3, 4, 11, 19, -12, 14].map((a, i) => (
			<path
				key={i}
				d={`M${(i - 4) * 9},0 Q${(i - 4) * 9 - 14},-150 ${(i - 4) * 9 + Math.sin(a) * 30},-${230 + (i % 3) * 50} Q${(i - 4) * 9 + 18},-140 ${(i - 4) * 9 + 14},0 Z`}
				fill={i % 2 ? '#3F7334' : '#2A5527'}
				stroke="#B8C76A"
				strokeWidth={2}
				transform={`rotate(${a * 0.6} 0 0)`}
			/>
		))}
		<path d="M-80,0 L80,0 L70,150 Q0,162 -70,150 Z" fill="#6A3A2C" />
		<rect x={-86} y={-8} width={172} height={14} rx={5} fill="#7A4532" />
	</g>
);

const Sideboard: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
	<g>
		<rect x={x} y={y} width={w} height={150} rx={6} fill="#8A4A22" />
		<rect x={x} y={y} width={w} height={14} rx={4} fill="#9C5A2C" />
		{[0, 1, 2].map((i) => (
			<rect
				key={i}
				x={x + 16 + i * ((w - 32) / 3)}
				y={y + 26}
				width={(w - 32) / 3 - 10}
				height={110}
				rx={3}
				fill={i === 1 ? '#7A3F1C' : '#93522A'}
				stroke="#6C3616"
				strokeWidth={2}
			/>
		))}
		<rect x={x + 20} y={y + 150} width={10} height={60} fill="#5A2D12" />
		<rect x={x + w - 30} y={y + 150} width={10} height={60} fill="#5A2D12" />
	</g>
);

const Armchair: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<path d="M0,0 L40,-170 L64,-170 L30,10 Z" fill="#8E4E24" />
		<rect x={10} y={-20} width={230} height={40} rx={10} fill="#A86A3A" />
		<path d="M38,-160 L210,-150 L228,-24 L22,-24 Z" fill="#C79A5E" opacity={0.9} />
		{[0, 1, 2, 3, 4, 5].map((i) => (
			<line key={i} x1={44 + i * 30} y1={-150} x2={36 + i * 32} y2={-26} stroke="#A9773E" strokeWidth={4} />
		))}
		<path d="M20,20 L0,120 M230,20 L250,120 M70,20 L60,110 M190,20 L200,110" stroke="#7A3F1C" strokeWidth={10} strokeLinecap="round" />
	</g>
);

const Sofa: React.FC<{x: number; y: number}> = ({x, y}) => (
	<g>
		<rect x={x} y={y - 120} width={560} height={160} rx={70} fill="#E7E1D6" />
		<rect x={x + 30} y={y - 30} width={540} height={140} rx={60} fill="#F1ECE3" />
		<rect x={x + 60} y={y - 150} width={130} height={110} rx={30} fill="#2E4A33" transform={`rotate(-8 ${x + 120} ${y - 100})`} />
		<rect x={x + 200} y={y - 150} width={130} height={110} rx={30} fill="#3D5C41" transform={`rotate(6 ${x + 260} ${y - 100})`} />
	</g>
);

const Bed: React.FC<{x: number; y: number}> = ({x, y}) => (
	<g>
		<rect x={x} y={y - 260} width={620} height={200} rx={10} fill="#8A4A22" />
		<rect x={x + 20} y={y - 90} width={580} height={110} rx={14} fill="#F2EEE6" />
		<rect x={x + 60} y={y - 150} width={200} height={80} rx={26} fill="#E6E0D3" />
		<rect x={x + 330} y={y - 150} width={200} height={80} rx={26} fill="#E6E0D3" />
		<path d={`M${x + 10},${y - 60} L${x + 610},${y - 60} L${x + 640},${y + 120} L${x - 20},${y + 120} Z`} fill="#2F4F35" />
		<path d={`M${x + 10},${y - 60} L${x + 610},${y - 60} L${x + 612},${y - 30} L${x + 8},${y - 30} Z`} fill="#3D6444" />
	</g>
);

const Lamp: React.FC<{x: number; y: number; on?: boolean}> = ({x, y}) => (
	<g>
		<path d={`M${x - 46},${y - 90} Q${x},${y - 150} ${x + 46},${y - 90} Z`} fill="#9CC2A6" />
		<rect x={x - 5} y={y - 92} width={10} height={80} fill="#7FA48A" />
		<ellipse cx={x} cy={y - 10} rx={34} ry={10} fill="#7FA48A" />
	</g>
);

/**
 * Stylised mid-century interior, drawn at 1920 x 1080.
 */
export const Room: React.FC<Props> = ({
	variant = 'living',
	health,
	glow = 0,
	sun = 1,
	id = 'room',
	showPlant = true,
}) => {
	const floorY = 820;
	return (
		<svg viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
			<defs>
				<linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#C9C6A9" />
					<stop offset="0.6" stopColor="#B4B595" />
					<stop offset="1" stopColor="#8F9177" />
				</linearGradient>
				<linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#6E3A22" />
					<stop offset="1" stopColor="#4B2414" />
				</linearGradient>
				<linearGradient id={`${id}-sun`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#FFE7AE" stopOpacity={0.75} />
					<stop offset="1" stopColor="#FFD58A" stopOpacity={0} />
				</linearGradient>
				<radialGradient id={`${id}-vignette`} cx="0.5" cy="0.45" r="0.75">
					<stop offset="0.55" stopColor="#000" stopOpacity={0} />
					<stop offset="1" stopColor="#000" stopOpacity={0.45} />
				</radialGradient>
			</defs>

			{/* Wall + floor */}
			<rect width={1920} height={floorY} fill={`url(#${id}-wall)`} />
			<rect y={floorY} width={1920} height={1080 - floorY} fill={`url(#${id}-floor)`} />
			{Array.from({length: 16}).map((_, i) => (
				<line
					key={i}
					x1={i * 140 - 200}
					y1={floorY}
					x2={i * 180 - 500}
					y2={1080}
					stroke="#3E1D10"
					strokeOpacity={0.35}
					strokeWidth={2}
				/>
			))}
			<rect y={floorY - 14} width={1920} height={14} fill="#E3DCCB" />
			{/* Ceiling beams */}
			<rect width={1920} height={40} fill="#5E3C2A" />
			<path d="M260,0 L420,0 L380,60 L300,60 Z" fill="#6E4630" />
			<path d="M1480,0 L1640,0 L1600,60 L1520,60 Z" fill="#6E4630" />

			{/* Window light */}
			<g opacity={sun}>
				<path d="M0,120 L760,120 L1340,820 L380,820 Z" fill={`url(#${id}-sun)`} />
				<path d="M1100,80 L1500,80 L1900,700 L1500,700 Z" fill={`url(#${id}-sun)`} opacity={0.6} />
			</g>

			{variant === 'living' && (
				<>
					<Art x={300} y={230} w={170} h={250} kind={0} />
					<Art x={510} y={200} w={130} h={150} kind={2} />
					<Art x={510} y={380} w={130} h={130} kind={1} />
					<Art x={1230} y={240} w={190} h={230} kind={1} />
					<Art x={1460} y={260} w={140} h={200} kind={3} />
					<Sideboard x={300} y={560} w={560} />
					<SmallPlant x={350} y={560} s={1} />
					<rect x={600} y={540} width={26} height={20} rx={4} fill="#4E6B4E" />
					<path d="M680,560 Q690,500 700,560 Z" fill="#3E5E44" />
					<path d="M720,560 Q735,480 750,560 Z" fill="#5C7C5C" />
					<Armchair x={170} y={830} s={1.1} />
					<rect x={1110} y={620} width={120} height={200} rx={4} fill="#7A3F1C" />
					{[0, 1, 2, 3, 4].map((i) => (
						<rect key={i} x={1122 + i * 18} y={720} width={14} height={86} fill={['#E1D6B8', '#5E7B5E', '#B98C55', '#D7CFC0', '#40593F'][i]} />
					))}
					<Lamp x={1170} y={620} />
					<Sofa x={1340} y={960} />
				</>
			)}

			{variant === 'bedroom' && (
				<>
					<Art x={200} y={240} w={170} h={240} kind={2} />
					<Art x={400} y={220} w={130} h={170} kind={0} />
					<Art x={1250} y={200} w={160} h={210} kind={3} />
					<Art x={1440} y={230} w={140} h={160} kind={1} />
					<Sideboard x={140} y={600} w={420} />
					<SmallPlant x={200} y={600} s={0.9} />
					<Armchair x={560} y={860} s={1} />
					<rect x={1040} y={660} width={130} height={160} rx={6} fill="#8A4A22" />
					<Lamp x={1105} y={660} />
					<Bed x={1180} y={860} />
				</>
			)}

			{variant === 'corner' && (
				<>
					{/* Window on the left */}
					<rect x={60} y={120} width={360} height={640} fill="#EAF0EE" />
					<rect x={60} y={120} width={360} height={640} fill="none" stroke="#8A6A4A" strokeWidth={16} />
					<line x1={240} y1={120} x2={240} y2={760} stroke="#8A6A4A" strokeWidth={10} />
					<Art x={1250} y={180} w={230} h={300} kind={0} />
					<Art x={1520} y={220} w={150} h={200} kind={3} />
					<SnakePlant x={1180} y={780} s={1.1} />
					<Armchair x={1500} y={850} s={1.1} />
					<SmallPlant x={560} y={820} s={1.6} />
				</>
			)}

			{showPlant && variant !== 'corner' ? (
				<foreignObject x={variant === 'bedroom' ? 640 : 560} y={variant === 'bedroom' ? 80 : 40} width={800} height={900}>
					<Plant health={health} glow={glow} id={`${id}-plant`} style={{width: 800, height: 900}} />
				</foreignObject>
			) : null}
			{showPlant && variant === 'corner' ? (
				<foreignObject x={560} y={60} width={800} height={900}>
					<Plant health={health} id={`${id}-plant`} style={{width: 800, height: 900}} />
				</foreignObject>
			) : null}

			<rect width={1920} height={1080} fill={`url(#${id}-vignette)`} />
		</svg>
	);
};
