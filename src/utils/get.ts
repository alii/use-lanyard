import {API, type Routes, type Types} from '@prequist/lanyard';
import {LanyardError} from '../hooks/rest';
import {DEFAULT_OPTIONS, type Options} from '../types';

export interface GetOptions extends Options {
	controller?: AbortController;
}

export function getURL(snowflake: Types.Snowflake, options: Options) {
	const protocol = options.api.secure ? ('https' as const) : ('http' as const);

	return `${protocol}://${options.api.hostname}/v1/users/${snowflake}` as const;
}

export async function get(
	url: ReturnType<typeof getURL>,
	options: GetOptions = DEFAULT_OPTIONS,
) {
	const init: RequestInit = {
		method: 'GET',
		signal: options.controller?.signal ?? null,
		headers: {Accept: 'application/json'},
	};

	const request = new Request(url, init);
	const response = await fetch(request);

	const body = (await response.json()) as Routes.GetPresence;

	if (!API.isSuccess(response, body)) {
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
