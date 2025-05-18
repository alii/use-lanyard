export type Options = {
	/**
	 * The Base URL of Lanyard's API. Defaults to `https://api.lanyard.rest`
	 */
	api: {
		hostname: string;
		secure?: boolean;
	};

	/**
	 * Initial data to use. Useful if server side rendering.
	 */
	initialData?: import('@prequist/lanyard').Types.Presence;
};

export const DEFAULT_OPTIONS: Options = {
	api: {
		hostname: 'api.lanyard.rest',
		secure: true,
	},
};

export type {Types} from '@prequist/lanyard';
