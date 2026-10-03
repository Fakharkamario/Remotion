import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Plant} from '../components/Plant';
import {COLORS, EASE_IN_OUT, EASE_OUT, FONT, tween} from '../theme';

const cardStyle: React.CSSProperties = {
	background: COLORS.card,
	borderRadius: 30,
	boxShadow: '0 20px 50px rgba(40,50,40,0.07)',
};

/** Blur + rise entrance used by every dashboard element. */
const useAppear = (start: number, dur = 16) => {
	const frame = useCurrentFrame();
	const p = tween(frame, start, start + dur, 0, 1, EASE_OUT);
	return {
		opacity: p,
		filter: `blur(${(1 - p) * 12}px)`,
		transform: `translateY(${(1 - p) * 24}px)`,
	} as React.CSSProperties;
};

const Icon: React.FC<{kind: 'water' | 'feed' | 'pot'}> = ({kind}) => (
	<div
		style={{
			width: 44,
			height: 44,
			borderRadius: 12,
			background: '#9CC98E',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		}}
	>
		<svg width={22} height={22} viewBox="0 0 24 24">
			{kind === 'water' ? (
				<path d="M12 3 C12 3 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 3 12 3Z" fill="#fff" />
			) : kind === 'feed' ? (
				<path d="M12 21 C6 17 4 12 6 6 C10 6 13 9 12 21Z M12 21 C18 17 20 12 18 6 C14 6 11 9 12 21Z" fill="#fff" />
			) : (
				<path d="M5 8 H19 L17 20 H7 Z M4 5 H20 V8 H4Z" fill="#fff" />
			)}
		</svg>
	</div>
);

const Task: React.FC<{kind: 'water' | 'feed' | 'pot'; title: string; sub: string; start: number}> = ({
	kind,
	title,
	sub,
	start,
}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 12, ...useAppear(start)}}>
		<Icon kind={kind} />
		<div style={{lineHeight: 1.1}}>
			<div style={{fontSize: 17, fontWeight: 600, color: COLORS.ink}}>{title}</div>
			<div style={{fontSize: 15, color: COLORS.muted}}>{sub}</div>
		</div>
	</div>
);

const TempBar: React.FC<{season: string; from: number; to: number; start: number}> = ({
	season,
	from,
	to,
	start,
}) => {
	const frame = useCurrentFrame();
	const grow = tween(frame, start + 4, start + 22, 0, 1, EASE_OUT);
	const left = (from / 30) * 100;
	const width = ((to - from) / 30) * 100 * grow;
	return (
		<div style={{marginTop: 14, ...useAppear(start)}}>
			<div style={{fontSize: 14, color: '#B4B6B4', marginBottom: 4}}>{season}</div>
			<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 15, color: COLORS.ink, marginBottom: 6}}>
				<span>0°C</span>
				<span>15°C</span>
				<span>30°C</span>
			</div>
			<div style={{position: 'relative', height: 22, borderRadius: 11, background: COLORS.cardMuted}}>
				<div
					style={{
						position: 'absolute',
						left: `${left}%`,
						width: `${width}%`,
						top: 0,
						bottom: 0,
						borderRadius: 11,
						background: '#9CC98E',
						color: '#fff',
						fontSize: 13,
						fontWeight: 600,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						overflow: 'hidden',
						whiteSpace: 'nowrap',
					}}
				>
					{from}°C – {to}°C
				</div>
			</div>
		</div>
	);
};

const Chip: React.FC<{label: string; start: number; glyph: string}> = ({label, start, glyph}) => (
	<div
		style={{
			width: 64,
			height: 64,
			borderRadius: 16,
			background: COLORS.card,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 11,
			color: COLORS.muted,
			gap: 2,
			...useAppear(start, 12),
		}}
	>
		<span style={{fontSize: 18, color: COLORS.ink}}>{glyph}</span>
		{label}
	</div>
);

/**
 * Local frame 0 = "Diagnosis ready" starts.
 */
export const Diagnosis: React.FC = () => {
	const frame = useCurrentFrame();

	// Title: blur in, sweep green -> ink
	const title = tween(frame, 0, 16, 0, 1, EASE_OUT);
	const sweep = tween(frame, 6, 30, -40, 140, EASE_IN_OUT);
	const lift = tween(frame, 18, 36, 0, 1, EASE_IN_OUT);
	const exit = tween(frame, 66, 78, 0, 1, EASE_IN_OUT);
	const floatY = Math.sin(frame / 24) * 3;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.paper,
				fontFamily: FONT,
				letterSpacing: '-0.03em',
				opacity: 1 - exit,
				filter: `blur(${exit * 14}px)`,
				transform: `scale(${1 + exit * 0.04})`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: interpolate(lift, [0, 1], [500, 230]),
					textAlign: 'center',
					fontSize: interpolate(lift, [0, 1], [84, 64]),
					letterSpacing: '-0.055em',
					opacity: title,
					filter: `blur(${(1 - title) * 12}px)`,
					transform: `scale(${1 + (1 - title) * 0.08})`,
				}}
			>
				<span
					style={{
						backgroundImage: `linear-gradient(100deg, ${COLORS.ink} ${sweep - 40}%, ${COLORS.accent} ${sweep}%, ${COLORS.ink} ${sweep + 40}%)`,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						color: 'transparent',
					}}
				>
					<span style={{fontWeight: 400}}>Diagnosis </span>
					<span style={{fontWeight: 700}}>ready</span>
				</span>
			</div>

			{/* Dashboard */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 380,
					transform: `translate(-50%, ${floatY}px) scale(1.2)`,
					transformOrigin: 'top center',
					display: 'flex',
					gap: 20,
				}}
			>
				{/* Plant card */}
				<div style={{...cardStyle, width: 420, height: 410, position: 'relative', overflow: 'hidden', ...useAppear(22, 18)}}>
					<div style={{position: 'absolute', left: 16, top: 16, width: 290, height: 290, borderRadius: 24, background: COLORS.cardMuted}} />
					<Plant health={0.15} id="diag-plant" sway={0.5} style={{position: 'absolute', left: -20, top: -20, width: 320, height: 360}} />
					<div style={{position: 'absolute', right: 20, top: 24, display: 'flex', flexDirection: 'column', gap: 12}}>
						<Chip label="Advanced" glyph="◆" start={30} />
						<Chip label="Full sun" glyph="☀" start={33} />
						<Chip label="Medium" glyph="●" start={36} />
					</div>
					<div style={{position: 'absolute', left: 28, bottom: 28}}>
						<div
							style={{
								display: 'inline-block',
								padding: '5px 14px',
								borderRadius: 14,
								background: COLORS.danger,
								color: '#fff',
								fontSize: 15,
								fontWeight: 500,
								marginBottom: 10,
								...useAppear(34, 12),
							}}
						>
							Needs care
						</div>
						<div style={{fontSize: 40, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.05em', ...useAppear(30)}}>
							Bird of Paradise
						</div>
					</div>
				</div>

				<div style={{display: 'flex', flexDirection: 'column', gap: 20, width: 520}}>
					<div style={{...cardStyle, padding: '24px 28px', ...useAppear(26, 18)}}>
						<div style={{fontSize: 24, fontWeight: 500, color: COLORS.ink, marginBottom: 16}}>Upcoming</div>
						<div style={{display: 'flex', justifyContent: 'space-between'}}>
							<Task kind="water" title="Water" sub="in 2 days" start={32} />
							<Task kind="feed" title="Fertilize" sub="in 11 days" start={35} />
							<Task kind="pot" title="Repot" sub="March 4" start={38} />
						</div>
					</div>
					<div style={{...cardStyle, padding: '22px 28px 26px', flex: 1, ...useAppear(30, 18)}}>
						<div style={{fontSize: 24, fontWeight: 500, color: COLORS.ink}}>Ideal Temperature</div>
						<TempBar season="Summer" from={18} to={24} start={36} />
						<TempBar season="Winter" from={10} to={18} start={40} />
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
