import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Room, RoomVariant} from '../components/Room';
import {COLORS, EASE_IN_OUT, EASE_OUT, FONT, tween} from '../theme';

const CARD = 92;

// Screen x of the gap between "Another" and "dead plant?".
const GAP_X = 920;
const LINE_Y = 540;

// Card resting positions on an arc around the headline (relative to centre).
const ARC = Array.from({length: 9}).map((_, i) => {
	const t = i / 8;
	const a = Math.PI * (1.05 + t * 0.95); // from left, over the top, to the right
	return {x: Math.cos(a) * 470, y: Math.sin(a) * 210 - 20, rot: (i % 3) * 3 - 3};
});

const VARIANTS: RoomVariant[] = ['living', 'bedroom', 'living'];

const Thumb: React.FC<{i: number}> = ({i}) => {
	const frame = useCurrentFrame();
	const delay = i * 1.6;
	// Swing in from top-right along a curve
	const enter = tween(frame, 2 + delay, 22 + delay, 0, 1, EASE_OUT);
	// Rotate along the arc slowly while the text builds
	const drift = tween(frame, 10, 44, 0, 1, EASE_IN_OUT);
	// Collapse into the gap between "Another" and "dead"
	const collapse = tween(frame, 38 + (8 - i) * 0.6, 50 + (8 - i) * 0.6, 0, 1, EASE_IN_OUT);

	const arcIdx = i + drift * -2.4;
	const lo = Math.max(0, Math.min(8, Math.floor(arcIdx)));
	const hi = Math.max(0, Math.min(8, lo + 1));
	const f = Math.max(0, Math.min(1, arcIdx - lo));
	const restX = ARC[lo].x * (1 - f) + ARC[hi].x * f;
	const restY = ARC[lo].y * (1 - f) + ARC[hi].y * f + drift * 70;

	const startX = 900;
	const startY = -520;
	let x = interpolate(enter, [0, 1], [startX, restX]);
	let y = interpolate(enter, [0, 1], [startY, restY]);
	// Gap target (relative to screen centre)
	const gx = GAP_X - 960;
	const gy = 0;
	x = interpolate(collapse, [0, 1], [x, gx + (i - 4) * 4]);
	y = interpolate(collapse, [0, 1], [y, gy]);

	const scale = interpolate(enter, [0, 1], [1.6, 1]) * interpolate(collapse, [0, 1], [1, 0.75]);
	const blur = Math.abs(1 - enter) * 10 + Math.sin(collapse * Math.PI) * 4;
	const opacity = Math.min(enter * 2, 1) * interpolate(collapse, [0.85, 1], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				top: '50%',
				width: CARD,
				height: CARD,
				marginLeft: -CARD / 2,
				marginTop: -CARD / 2,
				borderRadius: 16,
				overflow: 'hidden',
				transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${ARC[i].rot * (1 - collapse)}deg)`,
				filter: `blur(${blur}px)`,
				opacity,
				boxShadow: '0 10px 30px rgba(30,40,30,0.18)',
			}}
		>
			<div
				style={{
					position: 'absolute',
					width: 260,
					height: 146,
					left: -84 + ((i % 3) - 1) * 12,
					top: -24 - (i % 2) * 10,
				}}
			>
				<Room variant={VARIANTS[i % 3]} health={0} id={`thumb-${i}`} sun={0.9} />
			</div>
		</div>
	);
};

const Word: React.FC<{
	children: string;
	start: number;
	weight?: number;
	tint?: boolean;
}> = ({children, start, weight = 500, tint}) => {
	const frame = useCurrentFrame();
	const p = tween(frame, start, start + 14, 0, 1, EASE_OUT);
	const colourP = tween(frame, start + 4, start + 20, 0, 1, EASE_IN_OUT);
	return (
		<span
			style={{
				display: 'inline-block',
				opacity: p,
				filter: `blur(${(1 - p) * 14}px)`,
				transform: `translateY(${(1 - p) * 18}px) scale(${1 + (1 - p) * 0.08})`,
				color: tint
					? `color-mix(in srgb, ${COLORS.accent} ${(1 - colourP) * 100}%, ${COLORS.ink})`
					: COLORS.ink,
				fontWeight: weight,
			}}
		>
			{children}
		</span>
	);
};

export const Intro: React.FC = () => {
	const frame = useCurrentFrame();
	// "Another" starts big & soft then settles to headline size.
	const settle = tween(frame, 0, 18, 0, 1, EASE_OUT);
	const headScale = interpolate(settle, [0, 1], [1.7, 1]);
	const headBlur = (1 - settle) * 6;
	// Gap opens between "Another" and "dead" as the cards collapse into it.
	const gap = tween(frame, 34, 46, 18, 150, EASE_IN_OUT);
	// Whole line drifts slightly for life
	const drift = tween(frame, 0, 56, -10, 10, EASE_IN_OUT);

	// The room card that grows out of the gap and becomes the next shot.
	const cardIn = tween(frame, 40, 47, 0, 1, EASE_OUT);
	const grow = tween(frame, 45, 60, 0, 1, EASE_IN_OUT);
	const startScale = 0.065;
	const scale = interpolate(grow, [0, 1], [startScale, 1.04]);
	const cx = interpolate(grow, [0, 1], [GAP_X + drift, 960]);
	const radius = interpolate(grow, [0, 1], [16 / startScale, 0]);

	const textStyle: React.CSSProperties = {
		position: 'absolute',
		top: LINE_Y,
		fontSize: 76,
		letterSpacing: '-0.05em',
		color: COLORS.ink,
		whiteSpace: 'nowrap',
		transform: 'translateY(-50%)',
	};

	return (
		<AbsoluteFill style={{backgroundColor: COLORS.paper, fontFamily: FONT}}>
			{Array.from({length: 9}).map((_, i) => (
				<Thumb key={i} i={i} />
			))}
			<AbsoluteFill style={{transform: `translateX(${drift}px)`}}>
				<div style={{...textStyle, right: 1920 - (GAP_X - gap / 2)}}>
					<span
						style={{
							display: 'inline-block',
							transform: `scale(${headScale})`,
							transformOrigin: 'right center',
							filter: `blur(${headBlur}px)`,
							fontWeight: 500,
						}}
					>
						Another
					</span>
				</div>
				<div style={{...textStyle, left: GAP_X + gap / 2}}>
					<Word start={22} tint>
						dead
					</Word>
					<span style={{display: 'inline-block', width: 18}} />
					<Word start={27} tint>
						plant?
					</Word>
				</div>
			</AbsoluteFill>
			{frame >= 40 ? (
				<div
					style={{
						position: 'absolute',
						left: cx - 960,
						top: 0,
						width: 1920,
						height: 1080,
						transform: `scale(${scale})`,
						borderRadius: radius,
						overflow: 'hidden',
						opacity: cardIn,
						boxShadow: `0 ${30 / scale}px ${60 / scale}px rgba(30,40,30,${0.2 * (1 - grow)})`,
					}}
				>
					<Room variant="living" health={0} id="intro-expand" />
				</div>
			) : null}
		</AbsoluteFill>
	);
};
