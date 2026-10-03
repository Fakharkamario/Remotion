import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, EASE_IN_OUT, EASE_OUT, FONT, tween} from '../theme';

/**
 * Local frame 0 = white panel starts wiping in from the right over the rooms.
 */
export const Tagline: React.FC = () => {
	const frame = useCurrentFrame();
	const wipe = tween(frame, 0, 18, 0, 1, EASE_IN_OUT);
	const textX = interpolate(wipe, [0, 1], [700, 0]);
	const alive = tween(frame, 10, 22, 0, 1, EASE_OUT);
	const sweep = tween(frame, 12, 34, 0, 1, EASE_IN_OUT);
	const settle = tween(frame, 0, 40, 0, 1, EASE_OUT);

	return (
		<AbsoluteFill
			style={{
				clipPath: `inset(0 0 0 ${(1 - wipe) * 100}%)`,
				backgroundColor: COLORS.paper,
				fontFamily: FONT,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					fontSize: 76,
					letterSpacing: '-0.055em',
					color: COLORS.ink,
					transform: `translateX(${textX}px) scale(${1.03 - settle * 0.03})`,
					whiteSpace: 'nowrap',
				}}
			>
				<span style={{fontWeight: 400}}>Keep your plants </span>
				<span
					style={{
						display: 'inline-block',
						fontWeight: 700,
						opacity: alive,
						filter: `blur(${(1 - alive) * 10}px)`,
						color: `color-mix(in srgb, ${COLORS.accent} ${(1 - sweep) * 100}%, ${COLORS.ink})`,
						textShadow: `0 0 ${24 * (1 - sweep)}px rgba(63,196,58,${0.5 * (1 - sweep)})`,
					}}
				>
					alive
				</span>
			</div>
		</AbsoluteFill>
	);
};
