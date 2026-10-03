import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND, COLORS, EASE_IN_OUT, EASE_OUT, FONT, tween} from '../theme';

const Leaf: React.FC<{size: number}> = ({size}) => (
	<svg width={size} height={size} viewBox="0 0 48 48">
		<path d="M24 44 C10 36 6 22 12 6 C28 8 40 20 24 44 Z" fill={COLORS.brandLight} />
		<path d="M24 44 C22 30 18 20 12 6" fill="none" stroke={COLORS.brandDark} strokeWidth={2.4} strokeLinecap="round" />
	</svg>
);

/**
 * Local frame 0 = dark green end card starts.
 */
export const Logo: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const bg = tween(frame, 0, 10, 0, 1, EASE_IN_OUT);
	const word = tween(frame, 4, 22, 0, 1, EASE_OUT);
	const leaf = tween(frame, 8, 24, 0, 1, EASE_OUT);
	const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<AbsoluteFill
				style={{
					backgroundColor: COLORS.brandDark,
					opacity: bg * (1 - out),
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: FONT,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 14,
						transform: `scale(${interpolate(word, [0, 1], [0.9, 1]) + frame * 0.0012})`,
					}}
				>
					<div
						style={{
							opacity: leaf,
							transform: `rotate(${(1 - leaf) * -40}deg) scale(${leaf})`,
						}}
					>
						<Leaf size={76} />
					</div>
					<div
						style={{
							fontSize: 72,
							fontWeight: 600,
							letterSpacing: '-0.035em',
							color: COLORS.brandLight,
							opacity: word,
							filter: `blur(${(1 - word) * 12}px)`,
						}}
					>
						{BRAND}
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
