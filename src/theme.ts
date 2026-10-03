import '@fontsource-variable/inter';
import {continueRender, delayRender, Easing, interpolate} from 'remotion';

// Bundled locally so renders never depend on network font loading.
export const FONT = "'Inter Variable', sans-serif";

// Hold rendering until every weight we use has loaded.
const fontHandle = delayRender('Loading Inter');
Promise.all(
	[400, 500, 600, 700].map((w) => document.fonts.load(`${w} 40px 'Inter Variable'`)),
)
	.then(() => continueRender(fontHandle))
	.catch(() => continueRender(fontHandle));

export const BRAND = 'Plantea';

export const COLORS = {
	paper: '#F3F2F5',
	ink: '#1E3A1F',
	inkSoft: '#2F4A30',
	brandDark: '#1F3320',
	brandLight: '#CFF0BE',
	accent: '#3FC43A',
	accentSoft: '#B9DDA9',
	card: '#FFFFFF',
	cardMuted: '#ECEBEF',
	danger: '#8E2B2B',
	muted: '#8A8F8A',
};

// Smooth, "Apple-style" easings used throughout.
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/** Clamped interpolation from [start, end] frames to [from, to] with an easing. */
export const tween = (
	frame: number,
	start: number,
	end: number,
	from: number,
	to: number,
	easing: (t: number) => number = EASE_OUT,
) =>
	interpolate(frame, [start, end], [from, to], {
		easing,
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
