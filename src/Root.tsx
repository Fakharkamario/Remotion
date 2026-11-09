import React from 'react';
import {Composition} from 'remotion';
import {PlanteaPromo, PROMO_DURATION} from './PlanteaPromo';
import {BridgeShort, BRIDGE_FRAMES} from './videos/molasses/Bridge';
import {SheetTest} from './videos/canary/SheetTest';
import {BridgeShort as CanaryShort, BRIDGE_FRAMES as CANARY_FRAMES} from './videos/canary/Bridge';

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
		<Composition id="CanaryShort" component={CanaryShort} durationInFrames={CANARY_FRAMES} fps={30} width={1080} height={1920} />
		<Composition id="CanarySheet" component={SheetTest} durationInFrames={1} fps={30} width={2400} height={2000} />
		</>
	);
};
