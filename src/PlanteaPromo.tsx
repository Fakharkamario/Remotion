import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Analyze} from './scenes/Analyze';
import {Diagnosis} from './scenes/Diagnosis';
import {Intro} from './scenes/Intro';
import {Logo} from './scenes/Logo';
import {Rooms} from './scenes/Rooms';
import {Scanning} from './scenes/Scanning';
import {Tagline} from './scenes/Tagline';
import {COLORS} from './theme';

// Timeline (30fps). Scenes overlap slightly so transitions blend.
export const TIMELINE = {
	intro: {from: 0, duration: 61},
	analyze: {from: 60, duration: 92},
	scanning: {from: 142, duration: 58},
	diagnosis: {from: 194, duration: 80},
	rooms: {from: 264, duration: 56},
	tagline: {from: 304, duration: 40},
	logo: {from: 336, duration: 34},
};

export const PROMO_DURATION = 370;

export const PlanteaPromo: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.paper}}>
			<Sequence {...seq('intro')} name="Intro: Another dead plant?">
				<Intro />
			</Sequence>
			<Sequence {...seq('analyze')} name="Room + Analyze">
				<Analyze />
			</Sequence>
			<Sequence {...seq('scanning')} name="Scanning">
				<Scanning />
			</Sequence>
			<Sequence {...seq('diagnosis')} name="Diagnosis ready">
				<Diagnosis />
			</Sequence>
			<Sequence {...seq('rooms')} name="Healthy rooms">
				<Rooms />
			</Sequence>
			<Sequence {...seq('tagline')} name="Keep your plants alive">
				<Tagline />
			</Sequence>
			<Sequence {...seq('logo')} name="Logo">
				<Logo />
			</Sequence>
		</AbsoluteFill>
	);
};

function seq(key: keyof typeof TIMELINE) {
	const {from, duration} = TIMELINE[key];
	return {from, durationInFrames: duration, premountFor: 30};
}
