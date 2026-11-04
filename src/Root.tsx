import React from 'react';
import {Composition} from 'remotion';
import {PlanteaPromo, PROMO_DURATION} from './PlanteaPromo';
import {BridgeShort, BRIDGE_FRAMES} from './videos/molasses/Bridge';
import {CastSheet} from './videos/hiroshima/CastSheet';
import {HiroshimaShort, HIRO_FRAMES} from './videos/hiroshima/Bridge';

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
		<Composition id="HiroshimaShort" component={HiroshimaShort} durationInFrames={HIRO_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="HiroCast" component={CastSheet} durationInFrames={1} fps={30} width={1800} height={2000} />
		</>
	);
};
