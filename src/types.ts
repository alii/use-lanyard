export type Options<
	TInitialData = import('@prequist/lanyard').Types.Presence,
> = {
	/**
	 * The Base URL of Lanyard's API. Defaults to `https://api.lanyard.rest`
	 */
	api: {
		hostname: string;
		secure?: boolean;
	};

	/**
	 * Initial data to use. Useful if server side rendering.
	 *
	 * For a single snowflake this is a presence object. When subscribing
	 * to multiple snowflakes with `useLanyardWS`, this is a map of
	 * snowflake to presence.
	 */
	initialData?: TInitialData;
};

export const DEFAULT_OPTIONS: Options = {
	api: {
		hostname: 'api.lanyard.rest',
		secure: true,
	},
};

export type {Types} from '@prequist/lanyard';
