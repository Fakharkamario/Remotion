import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Plant} from '../components/Plant';
import {COLORS, EASE_IN_OUT, EASE_OUT, FONT, tween} from '../theme';

const CARD = 330;

const Bracket: React.FC<{corner: 0 | 1 | 2 | 3}> = ({corner}) => {
	const s = 54;
	const rot = [0, 90, 270, 180][corner];
	const pos: React.CSSProperties = [
		{left: 34, top: 34},
		{right: 34, top: 34},
		{left: 34, bottom: 34},
		{right: 34, bottom: 34},
	][corner];
	return (
		<svg width={s} height={s} viewBox="0 0 54 54" style={{position: 'absolute', ...pos, transform: `rotate(${rot}deg)`}}>
			<path d="M4,50 L4,16 Q4,4 16,4 L50,4" fill="none" stroke="#A9CFA0" strokeWidth={7} strokeLinecap="round" />
		</svg>
	);
};

const Spinner: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<svg width={28} height={28} viewBox="-14 -14 28 28">
			{Array.from({length: 8}).map((_, i) => {
				const a = (i / 8) * Math.PI * 2;
				const phase = ((frame / 2 - i) % 8 + 8) % 8;
				return (
					<circle
						key={i}
						cx={Math.cos(a) * 9}
						cy={Math.sin(a) * 9}
						r={2.4}
						fill={COLORS.ink}
						opacity={interpolate(phase, [0, 8], [1, 0.15])}
					/>
				);
			})}
		</svg>
	);
};

/**
 * Local frame 0 = scanning card appears.
 */
export const Scanning: React.FC = () => {
	const frame = useCurrentFrame();

	const enter = tween(frame, 0, 16, 0, 1, EASE_OUT);
	// Card slides left to make room for the label.
	const shift = tween(frame, 12, 28, 0, 1, EASE_IN_OUT);
	const exit = tween(frame, 46, 56, 0, 1, EASE_IN_OUT);

	// Scan line: down, then back up, eased.
	const scan = interpolate(frame, [4, 24, 44], [0.95, 0.05, 0.85], {
		easing: EASE_IN_OUT,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const scanTop = 40 + scan * (CARD - 80);

	const label = tween(frame, 16, 28, 0, 1, EASE_OUT);
	const labelText = 'Scanning plant…';
	const chars = Math.round(tween(frame, 16, 32, 8, labelText.length, EASE_OUT));

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.paper,
				fontFamily: FONT,
				alignItems: 'center',
				justifyContent: 'center',
				opacity: 1 - exit,
				filter: `blur(${exit * 12}px)`,
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 64,
					transform: `translateX(${interpolate(shift, [0, 1], [280, 0])}px) scale(1.45)`,
				}}
			>
				<div
					style={{
						width: CARD,
						height: CARD,
						borderRadius: 54,
						background: '#E9E8EC',
						boxShadow: '0 30px 60px rgba(40,50,40,0.08), inset 0 0 0 1px rgba(255,255,255,0.7)',
						position: 'relative',
						overflow: 'hidden',
						opacity: enter,
						filter: `blur(${(1 - enter) * 10}px)`,
						transform: `scale(${interpolate(enter, [0, 1], [1.25, 1])})`,
					}}
				>
					{/* Natural plant, visible below the scan line */}
					<div style={{position: 'absolute', inset: 0, clipPath: `inset(${scanTop}px 0 0 0)`}}>
						<Plant health={0.1} id="scan-nat" sway={0.6} style={{position: 'absolute', left: 30, top: 18, width: 270, height: 300}} />
					</div>
					{/* Holographic version above the scan line */}
					<div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 ${CARD - scanTop}px 0)`}}>
						<Plant health={1} variant="scan" id="scan-holo" sway={0.6} style={{position: 'absolute', left: 30, top: 18, width: 270, height: 300}} />
					</div>
					{/* Scan bar */}
					<div
						style={{
							position: 'absolute',
							left: 36,
							right: 36,
							top: scanTop - 3,
							height: 6,
							borderRadius: 6,
							background: '#A9CFA0',
							boxShadow: '0 0 24px 6px rgba(120,230,100,0.55)',
						}}
					/>
					<Bracket corner={0} />
					<Bracket corner={1} />
					<Bracket corner={2} />
					<Bracket corner={3} />
				</div>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 14,
						width: 360,
						opacity: label,
						filter: `blur(${(1 - label) * 8}px)`,
						transform: `translateY(${(1 - label) * 16}px)`,
					}}
				>
					<Spinner />
					<span style={{fontSize: 38, letterSpacing: '-0.045em', color: COLORS.ink}}>
						<span style={{fontWeight: 600}}>{labelText.slice(0, Math.min(chars, 8))}</span>
						<span style={{fontWeight: 400}}>{labelText.slice(8, chars)}</span>
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
