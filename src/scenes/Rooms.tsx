import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Room, RoomVariant} from '../components/Room';
import {EASE_IN_OUT, EASE_OUT, tween} from '../theme';

const PANELS: RoomVariant[] = ['living', 'bedroom', 'corner'];

/**
 * Local frame 0 = healthy room fades in. A continuous pan travels across
 * three rooms; the tagline panel wipes over the end of it.
 */
export const Rooms: React.FC = () => {
	const frame = useCurrentFrame();
	const enter = tween(frame, 0, 12, 0, 1, EASE_OUT);
	// Pan from first to third room. Ease-in-out keeps the start/end soft.
	const pan = interpolate(frame, [4, 44], [0, 1], {
		easing: EASE_IN_OUT,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const x = -pan * 1920 * 1.55;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#000',
				opacity: enter,
				filter: `blur(${(1 - enter) * 14}px)`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					height: 1080,
					display: 'flex',
					transform: `translateX(${x}px) scale(${1.04 - pan * 0.03})`,
					transformOrigin: '960px 540px',
				}}
			>
				{PANELS.map((v, i) => (
					<div key={i} style={{width: 1920, height: 1080, flexShrink: 0}}>
						<Room variant={v} health={1} id={`pan-${i}`} sun={1} />
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};
