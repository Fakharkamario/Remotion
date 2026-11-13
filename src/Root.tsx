import React from 'react';
import {Composition} from 'remotion';
import {PlanteaPromo, PROMO_DURATION} from './PlanteaPromo';
import {BridgeShort, BRIDGE_FRAMES} from './videos/molasses/Bridge';
import {CharTest} from './videos/thief/CharTest';
import {ThiefShort, THIEF_FRAMES} from './videos/thief/Bridge';

export const RemotionRoot: React.FC = () => {
	return (
		<>
		<Composition
			id="PlanteaPromo"
			component={PlanteaPromo}
			durationInFrames={PROMO_DURATION}
			fps={30}
			width={1920}
			height={1080}
		/>
		<Composition id="MolassesShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="ThiefShort" component={ThiefShort} durationInFrames={THIEF_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="ThiefChars" component={CharTest} durationInFrames={1} fps={30} width={1440} height={1800} />
		</>
	);
};
