import {API, type Routes, type Types} from '@prequist/lanyard';
import {DEFAULT_OPTIONS, type Options} from '../types';

export class LanyardError extends Error {
	public readonly code: number;

	constructor(
		public readonly request: Request,
		public readonly response: Response,
		public readonly body: API.ErroredAPIResponse,
	) {
		super(body.error.message);
		this.code = this.response.status;
	}
}

export interface GetOptions extends Options {
	controller?: AbortController;
}

export function getURL(
	snowflake: Types.Snowflake,
	options: Options = DEFAULT_OPTIONS,
) {
	const protocol = options.api.secure ? 'https' : 'http';
	return `${protocol}://${options.api.hostname}/v1/users/${snowflake}` as const;
}

/**
 * Make a request to get the presence data for a user
 *
 * @param snowflake The snowflake to fetch presence for
 * @param options Options for the request. Same options structure as the useLanyard and useLanyardWS hooks
 * @returns A Result-like type with either the presence data, or a LanyardError instance
 */
export async function get(
	snowflake: Types.Snowflake,
	options: GetOptions = DEFAULT_OPTIONS,
) {
	const url = getURL(snowflake, options);

	const init: RequestInit = {
		method: 'GET',
		signal: options.controller?.signal ?? null,
		headers: {Accept: 'application/json'},
	};

	const request = new Request(url, init);
	const response = await fetch(request);

	const body = (await response.json()) as Routes.GetPresence;

	if (API.isErrored(response, body)) {
		return {
			success: false as const,
			error: new LanyardError(request, response, body),
		};
	}

	return {
		success: true as const,
		data: body.data,
	};
}
