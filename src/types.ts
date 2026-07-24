import {
	DEFAULT_API,
	type ApiConfig,
} from '@prequist/lanyard';

export type Options<
	TInitialData = import('@prequist/lanyard').Types.Presence,
> = {
	/**
	 * Where to reach the Lanyard API. Defaults to the
	 * public instance at `api.lanyard.rest`
	 */
	api: ApiConfig;

	/**
	 * Initial data to use. Useful if server side rendering.
	 *
	 * For a single snowflake this is a presence object. When subscribing
	 * to multiple snowflakes, this is a map of
	 * snowflake to presence.
	 */
	initialData?: TInitialData;
};

export const DEFAULT_OPTIONS: Options = {
	api: DEFAULT_API,
};

export type {ApiConfig, Types} from '@prequist/lanyard';
