import React from 'react';
import {interpolateColors, useCurrentFrame} from 'remotion';

export type PlantVariant = 'natural' | 'scan';

type Leaf = {
	angle: number; // degrees, 0 = straight up, negative = left
	stalk: number; // stalk length
	length: number; // leaf blade length
	width: number;
	curl: number; // how much the stalk bends (degrees over its length)
	tears: number; // number of splits in the blade
	phase: number; // sway phase
	tone: number; // 0..1 variation in colour
};

// A bird-of-paradise style plant. Leaves are defined once and reused.
const LEAVES: Leaf[] = [
	{angle: -58, stalk: 150, length: 210, width: 46, curl: -22, tears: 2, phase: 0.2, tone: 0.8},
	{angle: -40, stalk: 230, length: 230, width: 50, curl: -18, tears: 3, phase: 1.3, tone: 0.3},
	{angle: -24, stalk: 300, length: 240, width: 54, curl: -10, tears: 1, phase: 2.1, tone: 0.6},
	{angle: -10, stalk: 340, length: 230, width: 52, curl: -6, tears: 2, phase: 0.7, tone: 0.1},
	{angle: 4, stalk: 360, length: 220, width: 50, curl: 8, tears: 0, phase: 2.8, tone: 0.5},
	{angle: 18, stalk: 320, length: 240, width: 54, curl: 14, tears: 3, phase: 1.7, tone: 0.9},
	{angle: 33, stalk: 260, length: 230, width: 50, curl: 20, tears: 1, phase: 0.4, tone: 0.2},
	{angle: 50, stalk: 190, length: 220, width: 48, curl: 26, tears: 2, phase: 2.4, tone: 0.7},
	{angle: 66, stalk: 120, length: 190, width: 44, curl: 30, tears: 1, phase: 1.1, tone: 0.4},
	{angle: -72, stalk: 90, length: 170, width: 40, curl: -34, tears: 1, phase: 3.0, tone: 0.95},
];

const DEG = Math.PI / 180;

const bladePath = (l: number, rawW: number) => {
	const w = rawW * 1.35;
	return (
	`M0,0 C${l * 0.18},${-w * 1.05} ${l * 0.7},${-w * 1.1} ${l},0 C${l * 0.7},${w * 0.95} ${l * 0.18},${w} 0,0 Z`
	);
};

type Props = {
	/** 0 = dying (yellow/brown), 1 = healthy green */
	health: number;
	variant?: PlantVariant;
	/** Extra yellow glow on the leaves, 0..1 */
	glow?: number;
	/** Show the pot */
	pot?: boolean;
	sway?: number;
	style?: React.CSSProperties;
	id?: string;
};

/**
 * Drawn in a 800 x 900 viewBox. The pot sits at the bottom centre.
 */
export const Plant: React.FC<Props> = ({
	health,
	variant = 'natural',
	glow = 0,
	pot = true,
	sway = 1,
	style,
	id = 'plant',
}) => {
	const frame = useCurrentFrame();
	const baseX = 400;
	const baseY = 640;
	const scan = variant === 'scan';

	const leafFill = (tone: number) => {
		const dying = interpolateColors(tone, [0, 0.5, 1], ['#E2C14A', '#D7A936', '#B9852F']);
		const healthy = interpolateColors(tone, [0, 1], ['#4E9A45', '#2F6E31']);
		return interpolateColors(health, [0, 1], [dying, healthy]);
	};
	const edgeFill = (tone: number) => {
		const dying = interpolateColors(tone, [0, 1], ['#9C6A2A', '#7A4520']);
		const healthy = interpolateColors(tone, [0, 1], ['#2E6A2C', '#1F4F22']);
		return interpolateColors(health, [0, 1], [dying, healthy]);
	};
	const stalkColor = interpolateColors(health, [0, 1], ['#A27A3A', '#4C7A3A']);

	return (
		<svg viewBox="0 0 800 900" style={{overflow: 'visible', ...style}}>
			<defs>
				<filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="14" result="b" />
					<feMerge>
						<feMergeNode in="b" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<pattern id={`${id}-dots`} width="7" height="7" patternUnits="userSpaceOnUse">
					<circle cx="3.5" cy="3.5" r="1.6" fill="#7BE36A" />
				</pattern>
				<linearGradient id={`${id}-pot`} x1="0" x2="1">
					<stop offset="0" stopColor="#2A1E26" />
					<stop offset="0.45" stopColor="#4A3542" />
					<stop offset="1" stopColor="#21171E" />
				</linearGradient>
			</defs>

			<g filter={glow > 0.01 || scan ? `url(#${id}-glow)` : undefined}>
				{LEAVES.map((leaf, i) => {
					const swayDeg = Math.sin(frame / 22 + leaf.phase) * 1.6 * sway;
					const a = (leaf.angle + swayDeg) * DEG;
					const bend = leaf.curl * DEG;
					// Stalk as a quadratic curve, ending in the blade.
					const midA = a + bend * 0.4;
					const endA = a + bend;
					const mx = baseX + Math.sin(midA) * leaf.stalk * 0.5;
					const my = baseY - Math.cos(midA) * leaf.stalk * 0.5;
					const ex = baseX + Math.sin(endA) * leaf.stalk;
					const ey = baseY - Math.cos(endA) * leaf.stalk;
					const bladeAngle = (endA / DEG) - 90 + leaf.curl * 0.6;
					const fill = leafFill(leaf.tone);
					const edge = edgeFill(leaf.tone);
					return (
						<g key={i}>
							<path
								d={`M${baseX + (i - 5) * 3},${baseY} Q${mx},${my} ${ex},${ey}`}
								stroke={scan ? '#8BEA7B' : stalkColor}
								strokeWidth={scan ? 4 : 7}
								fill="none"
								strokeLinecap="round"
								opacity={scan ? 0.9 : 1}
							/>
							<g transform={`translate(${ex},${ey}) rotate(${bladeAngle})`}>
								{scan ? (
									<>
										<path
											d={bladePath(leaf.length, leaf.width)}
											fill="#A6F08F"
											opacity={0.35}
										/>
										<path
											d={bladePath(leaf.length, leaf.width)}
											fill={`url(#${id}-dots)`}
										/>
										<path
											d={bladePath(leaf.length, leaf.width)}
											fill="none"
											stroke="#6EDB5C"
											strokeWidth={2.5}
										/>
									</>
								) : (
									<>
										<path d={bladePath(leaf.length, leaf.width)} fill={edge} />
										<path
											d={bladePath(leaf.length * 0.96, leaf.width * 0.8)}
											transform={`translate(${leaf.length * 0.02},0)`}
											fill={fill}
										/>
										{glow > 0 ? (
											<path
												d={bladePath(leaf.length, leaf.width)}
												fill="#FFF27A"
												opacity={glow * 0.55}
											/>
										) : null}
									</>
								)}
								<line
									x1={0}
									y1={0}
									x2={leaf.length * 0.97}
									y2={0}
									stroke={scan ? '#D9FFD0' : interpolateColors(health, [0, 1], ['#F3DE8A', '#9CCB7E'])}
									strokeWidth={2.5}
									opacity={0.8}
								/>
								{/* Splits along the blade, characteristic of the plant */}
								{Array.from({length: leaf.tears}).map((_, t) => {
									const x = leaf.length * (0.3 + t * 0.2);
									const side = t % 2 === 0 ? -1 : 1;
									return (
										<line
											key={t}
											x1={x}
											y1={side * 4}
											x2={x + 14}
											y2={side * leaf.width * 0.85}
											stroke={scan ? '#6EDB5C' : '#F3F2EC'}
											strokeOpacity={scan ? 0.8 : 0.5}
											strokeWidth={2}
										/>
									);
								})}
							</g>
						</g>
					);
				})}
			</g>

			{pot ? (
				scan ? (
					<g filter={`url(#${id}-glow)`}>
						<path d="M318,630 L482,630 L466,800 Q400,814 334,800 Z" fill="#9CEB84" opacity={0.5} />
						<path d="M318,630 L482,630 L466,800 Q400,814 334,800 Z" fill={`url(#${id}-dots)`} />
						<path
							d="M318,630 L482,630 L466,800 Q400,814 334,800 Z"
							fill="none"
							stroke="#6EDB5C"
							strokeWidth={3}
						/>
					</g>
				) : (
					<g>
						<ellipse cx={400} cy={806} rx={92} ry={12} fill="#000" opacity={0.18} />
						<path d="M318,630 L482,630 L466,800 Q400,814 334,800 Z" fill={`url(#${id}-pot)`} />
						<rect x={312} y={622} width={176} height={18} rx={6} fill="#3B2B36" />
					</g>
				)
			) : null}
		</svg>
	);
};
