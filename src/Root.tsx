import React from 'react';
import {Composition} from 'remotion';
import {PlanteaPromo, PROMO_DURATION} from './PlanteaPromo';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="PlanteaPromo"
			component={PlanteaPromo}
			durationInFrames={PROMO_DURATION}
			fps={30}
			width={1920}
			height={1080}
		/>
	);
};
