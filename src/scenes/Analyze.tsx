import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Room} from '../components/Room';
import {COLORS, EASE_IN_OUT, EASE_OUT, FONT, tween} from '../theme';

const SearchIcon: React.FC<{size: number; active: number}> = ({size, active}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: size,
			background: `color-mix(in srgb, ${COLORS.accent} ${active * 100}%, ${COLORS.brandDark})`,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		}}
	>
		<svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
			<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="#fff" strokeWidth="2.8" />
			<line x1="15" y1="15" x2="20" y2="20" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
		</svg>
	</div>
);

/**
 * Local frame 0 = the room is revealed (clip expands from the headline gap).
 */
export const Analyze: React.FC = () => {
	const frame = useCurrentFrame();

	// Plant glow pulse, as if the app "notices" it.
	const glow =
		tween(frame, 14, 26, 0, 1, EASE_OUT) * (1 - tween(frame, 30, 46, 0, 1, EASE_IN_OUT)) * 0.9;

	// Pill assembles from little UI fragments.
	const build = tween(frame, 18, 36, 0, 1, EASE_OUT);
	const textIn = tween(frame, 26, 40, 0, 1, EASE_OUT);

	// Camera push-in toward plant + button.
	const push = tween(frame, 38, 58, 0, 1, EASE_IN_OUT);
	const pullBack = tween(frame, 70, 84, 0, 1, EASE_IN_OUT);
	const zoom = 1.04 + push * 0.62 - pullBack * 0.3;
	const camX = push * -40 + pullBack * 20;
	const camY = push * -60 + pullBack * 30;
	const kenBurns = 1 + frame * 0.0006;

	// Press
	const press =
		tween(frame, 60, 64, 0, 1, EASE_OUT) * (1 - tween(frame, 64, 72, 0, 1, EASE_OUT));
	const active = tween(frame, 61, 66, 0, 1, EASE_OUT) * (1 - tween(frame, 76, 86, 0, 1, EASE_IN_OUT));

	// Exit: soften & fade out into the scanning card
	const exit = tween(frame, 80, 92, 0, 1, EASE_IN_OUT);

	const pillW = interpolate(build, [0, 1], [26, 170]);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#000',
				opacity: 1 - exit,
				filter: `blur(${exit * 16}px)`,
			}}
		>
			<AbsoluteFill
				style={{
					transform: `translate(${camX}px, ${camY}px) scale(${zoom * kenBurns})`,
					transformOrigin: '1040px 620px',
				}}
			>
				<Room variant="living" health={0} glow={glow} id="analyze-room" />

				{/* UI fragments flying in */}
				{[0, 1, 2].map((i) => {
					const p = tween(frame, 16 + i * 2, 30 + i * 2, 0, 1, EASE_OUT);
					const fade = 1 - tween(frame, 28, 36, 0, 1, EASE_OUT);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: 1100 + [70, -20, 160][i] * (1 - p),
								top: 610 + [-90, 40, 20][i] * (1 - p),
								width: [8, 60, 30][i],
								height: [40, 10, 14][i],
								borderRadius: 6,
								background: COLORS.accent,
								boxShadow: `0 0 18px ${COLORS.accent}`,
								opacity: p * fade,
							}}
						/>
					);
				})}

				{/* Analyze pill */}
				<div
					style={{
						position: 'absolute',
						left: 1090,
						top: 600,
						height: 52,
						width: pillW,
						borderRadius: 30,
						background: `color-mix(in srgb, #D7F5C8 ${active * 100}%, rgba(255,255,255,0.94))`,
						boxShadow: `0 8px 24px rgba(0,0,0,0.25), 0 0 0 ${6 * active}px rgba(255,255,255,0.35)`,
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						padding: '0 8px',
						overflow: 'hidden',
						opacity: Math.min(1, build * 3),
						transform: `scale(${(0.6 + build * 0.4) * (1 - press * 0.08)})`,
						transformOrigin: 'left center',
						fontFamily: FONT,
					}}
				>
					<SearchIcon size={36} active={active} />
					<span
						style={{
							fontSize: 26,
							fontWeight: 500,
							letterSpacing: '-0.03em',
							color: `color-mix(in srgb, #2E8B2A ${active * 100}%, ${COLORS.ink})`,
							opacity: textIn,
							filter: `blur(${(1 - textIn) * 6}px)`,
							whiteSpace: 'nowrap',
						}}
					>
						Analyze
					</span>
				</div>

				{/* Touch ripple */}
				{frame > 58 ? (
					<div
						style={{
							position: 'absolute',
							left: 1200,
							top: 626,
							width: 0,
							height: 0,
						}}
					>
						<div
							style={{
								position: 'absolute',
								width: 120,
								height: 120,
								left: -60,
								top: -60,
								borderRadius: 120,
								background: 'rgba(255,255,255,0.6)',
								transform: `scale(${tween(frame, 58, 74, 0.2, 1.4, EASE_OUT)})`,
								opacity: 1 - tween(frame, 60, 76, 0, 1, EASE_OUT),
							}}
						/>
					</div>
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
